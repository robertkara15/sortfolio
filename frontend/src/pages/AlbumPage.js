import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

const AlbumPage = () => {
  const { albumId } = useParams();
  const [albumImages, setAlbumImages] = useState([]);
  const [coverImage, setCover] = useState(null);
  const [albumName, setAlbumName] = useState("");
  const [allImages, setAllImages] = useState([]);
  const [addMode, setAddMode] = useState(false); 
  const [removeMode, setRemoveMode] = useState(false);
  const [albumTags, setAlbumTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [addTagMode, setAddTagMode] = useState(false);
  const [removeTagMode, setRemoveTagMode] = useState(false);
  const [updateTrigger] = useState(false);
  const [albumPrompt, setAlbumPrompt] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [albumOwner, setAlbumOwner] = useState("");
  const [coverMode, setCoverMode] = useState(false);
  const [selectedCover, setSelectedCover] = useState(null);
  const navigate = useNavigate();

  const fetchAlbumData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [albumResponse, allImagesResponse, tagsResponse, userResponse] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/images/album/${albumId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://127.0.0.1:8000/images/my-images/", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://127.0.0.1:8000/images/user-tags/", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://127.0.0.1:8000/users/me/", { headers }),
      ]);

      const fetchedAlbumOwner = albumResponse.data.owner_username;
      const currentUsername = userResponse.data.username;

      console.log("Current User:", currentUsername);
      console.log("Album Owner:", fetchedAlbumOwner);

      setAlbumName(albumResponse.data.album_name || "Untitled Album");
      setAlbumImages(albumResponse.data.images);
      setAlbumTags(albumResponse.data.tags || []);
      setCover(albumResponse.data.cover_image_url);
      setAllImages(allImagesResponse.data);
      setAllTags(tagsResponse.data.tags || []);
      setAlbumOwner(albumResponse.data.owner_username);

      const isAlbumOwner = currentUsername === fetchedAlbumOwner;
      setIsOwner(isAlbumOwner);

    } catch (error) {
      console.error("Failed to fetch album data:", error);
      setAlbumImages([]);
      setAllImages([]);
      setAlbumTags([]);
      setAllTags([]);
    }
  }, [albumId]); 
  

  const addToAlbum = async (imageId) => {
    try {
      const token = localStorage.getItem("token");

      if (albumImages.some((img) => img.id === imageId)) {
        alert("This image is already in the album.");
        return;
      }

      await axios.post(
        `http://127.0.0.1:8000/images/album/${albumId}/`,
        { image_ids: [imageId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Instead of manually adding the image, fetch the updated album images
      const response = await axios.get(`http://127.0.0.1:8000/images/album/${albumId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Updated Album Images:", response.data.images);
      setAlbumImages(response.data.images);

    } catch (error) {
      console.error("Failed to add image to album:", error);
    }
};

  const removeFromAlbum = async (imageId) => {
    try {
      const token = localStorage.getItem("token");

      await axios.delete(`http://127.0.0.1:8000/images/album/${albumId}/`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { image_id: imageId },
      });

      setAlbumImages(albumImages.filter((img) => img.id !== imageId));
    } catch (error) {
      console.error("Failed to remove image from album:", error);
    }
  };

  const handleSetCover = async () => {
    if (!selectedCover) {
      alert("Please select an image as the cover.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://127.0.0.1:8000/images/album/${albumId}/set-cover/`,
        { image_id: selectedCover },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCover(response.data.cover_image_url);
      setCoverMode(false); // Exit cover selection mode
      setSelectedCover(null); // Clear selection

      alert("Cover image updated successfully!");
    } catch (error) {
      console.error("Failed to set cover image:", error);
      alert("Failed to update cover image.");
    }
  };


const handleDeleteAlbum = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this album?");
    if (!confirmDelete) return;

    try {
        const token = localStorage.getItem("token");

        await axios.delete(`http://127.0.0.1:8000/images/delete-album/${albumId}/`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        alert("Album deleted successfully.");
        navigate("/dashboard"); 

    } catch (error) {
        console.error("Failed to delete album:", error);
        alert("Failed to delete album.");
    }
};




const addTagsToAlbum = async (tag) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `http://127.0.0.1:8000/images/album/${albumId}/add-tags/`,
      { tags: [tag] },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.tags) {
      setAlbumTags([...response.data.tags]);  
    }

    if (response.data.images) {
      setAlbumImages([...response.data.images]);  
    }

    console.log("🔄 Updated Album Images: ", response.data.images);
    console.log("🔄 Updated Album Tags: ", response.data.tags);

    fetchAlbumData(); 

  } catch (error) {
    console.error("Failed to add tag:", error);
  }
};




const removeTagsFromAlbum = async (tag) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `http://127.0.0.1:8000/images/album/${albumId}/remove-tags/`,
      { tags: [tag] },  
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.tags) {
      console.log("Updated Album Tags:", response.data.tags);
      setAlbumTags([...response.data.tags]); 
    }

    if (response.data.images) {
      console.log("Updated Album Images:", response.data.images);
      setAlbumImages([...response.data.images]);
    }

    fetchAlbumData(); 

  } catch (error) {
    console.error("Failed to remove tag:", error);
  }
};

const updateAlbumTagsFromPrompt = async () => {
  if (!albumPrompt) return;

  try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
          `http://127.0.0.1:8000/images/album/${albumId}/update-tags-from-prompt/`,
          { prompt: albumPrompt },
          { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Album tags updated successfully!");
      window.location.reload();  // Refresh the page to reflect updated tags
  } catch (error) {
      console.error("Failed to update album tags:", error);
  }
};

useEffect(() => {
  fetchAlbumData();
}, [fetchAlbumData, updateTrigger]);

  

  return (
    <div>
      <div>
        <h1>{albumName}</h1>
      </div>

      <h2>Album Tags</h2>
      {albumTags.length > 0 ? (
        albumTags.map((tag) => (
          <span key={tag} style={{ marginRight: "10px", background: "#ddd", padding: "5px" }}>
            {tag}
          </span>
        ))
      ) : (
        <p>No tags in this album.</p>
      )}

      <h2>Album Images</h2>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {albumImages && albumImages.length > 0 ? (
            albumImages.map((img) => (
            <div 
                key={img.id} 
                style={{ 
                  margin: "10px", 
                  cursor: "pointer", 
                  padding: "10px", 
                  border: removeMode
                  ? "2px solid red"
                  : coverMode && selectedCover === img.id
                  ? "2px solid green"
                  : "1px solid #ddd"
                }}
                onClick={() => {
                  if (removeMode) {
                    removeFromAlbum(img.id);
                  } else if (coverMode) {
                    setSelectedCover(img.id);
                  } else {
                    navigate(`/image/${img.id}`);
                  }
                }}
            >
                <img 
                src={img.image_url || "default.jpg"}  
                alt="Album Content" 
                width="150" 
                onError={(e) => e.target.src = "default.jpg"} 
                />
                {removeMode && <p style={{ color: "red" }}>Click to Remove</p>}
            </div>
            ))
        ) : (
            <p>No images in this album.</p>
        )}
      </div>

      <div>
        {isOwner && (
          <div>
            <div>
              <h3>Update Album Tags with AI</h3>
              <input 
                  type="text" 
                  value={albumPrompt} 
                  onChange={(e) => setAlbumPrompt(e.target.value)} 
                  placeholder="An album consisting of..."
              />
              <button onClick={updateAlbumTagsFromPrompt}>Update Album Tags</button>
            </div>

            <div>
              <button onClick={() => setAddTagMode(!addTagMode)}>
                  {addTagMode ? "Exit Add Tag Mode" : "Add Tags"}
              </button>
              <button onClick={() => setRemoveTagMode(!removeTagMode)}>
                  {removeTagMode ? "Exit Remove Tags Mode" : "Remove Tags"}
              </button>
            </div>

            <div>
            {addTagMode && (
              <div>
                  <h3>Select Tags to Add</h3>
                  {allTags.map((tag) => (
                      !albumTags.includes(tag) && (
                          <button key={tag} onClick={() => addTagsToAlbum(tag)}>{tag}</button>
                      )
                  ))}
              </div>
            )}
            </div>

            <div>
            {removeTagMode && (
              <div>
                <h3>Select Tags to Remove</h3>
                {albumTags.map((tag) => (
                  <button key={tag} onClick={() => removeTagsFromAlbum([tag])}>{tag}</button>
                ))}
              </div>
            )}
            </div>

            <div>
              <button 
                onClick={handleDeleteAlbum}
                style={{
                    backgroundColor: "red",
                    color: "white",
                    padding: "10px",
                    border: "none",
                    cursor: "pointer",
                    marginTop: "10px"
                }}
              >
                Delete Album
              </button>
            </div>

            <div>
              <button onClick={() => { setAddMode(!addMode); setRemoveMode(false); }}>
                  {addMode ? "Exit Add Mode" : "Add Images to Album"}
              </button>
              <button onClick={() => { setRemoveMode(!removeMode); setAddMode(false); }}>
                  {removeMode ? "Exit Remove Mode" : "Remove Images from Album"}
              </button>
            </div>

            <div>
              {addMode && (
              <>
                <h3>Add Images to Album</h3>
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {allImages.map((img) => (
                    <div 
                      key={img.id} 
                      style={{ margin: "10px", cursor: "pointer", padding: "10px", border: "1px solid green" }}
                      onClick={() => addToAlbum(img.id)}
                    >
                      <img 
                        src={img.image_url || "default.jpg"}
                        alt="All Images" 
                        width="150" 
                        onError={(e) => e.target.src = "default.jpg"}
                      />
                      <p style={{ color: "green" }}>Click to Add</p>
                    </div>
                  ))}
                </div>
              </>
            )}
            </div>

            <div>
              <div>
                {/* Cover Selection Button */}
                <button onClick={() => setCoverMode(!coverMode)} style={{ marginTop: "10px" }}>
                  {coverMode ? "Cancel Cover Selection" : "Set Cover Image"}
                </button>

                {/* Save Cover Button */}
                {coverMode && (
                  <button onClick={handleSetCover} style={{ marginLeft: "10px" }}>
                    Save Cover
                  </button>
                )}
              </div>
            </div>


          </div>
        )}

      <button onClick={() => navigate(-1)}>Go Back</button>
      </div>          
    </div>
  );
};

export default AlbumPage;
