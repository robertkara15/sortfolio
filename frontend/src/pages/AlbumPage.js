import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/AlbumPage.css";

const AlbumPage = () => {
  const { albumId } = useParams();
  // eslint-disable-next-line no-unused-vars
  const [cover, setCover] = useState(null);
  const [albumImages, setAlbumImages] = useState([]);
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
      await axios.post(
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
    <div className="album-container">
      <div className="album-header">
        <h1>{albumName}</h1>
        <h3>Created by: {albumOwner || "Unknown"}</h3>
      </div>

      <h2>Album Tags</h2>
      {albumTags.length > 0 ? (
        <div className="tag-list">
          {albumTags.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      ) : (
        <p>No tags in this album.</p>
      )}

      <h2>Album Images</h2>
      <div className="image-grid">
        {albumImages.map((img) => (
          <div
            key={img.id}
            className={`image-card ${removeMode ? "remove" : ""} ${coverMode && selectedCover === img.id ? "cover-selected" : ""}`}
            onClick={() => {
              if (removeMode) removeFromAlbum(img.id);
              else if (coverMode) setSelectedCover(img.id);
              else navigate(`/image/${img.id}`);
            }}
          >
            <img src={img.image_url || "default.jpg"} alt="Album Content" />
            {removeMode && <p style={{ color: "red" }}>Click to Remove</p>}
          </div>
        ))}
      </div>

      {isOwner && (
        <>
          <div className="prompt-box">
            <h3>Update Album Tags with Semantic Search</h3>
            <input
              type="text"
              value={albumPrompt}
              onChange={(e) => setAlbumPrompt(e.target.value)}
              placeholder="An album consisting of..."
            />
            <button onClick={updateAlbumTagsFromPrompt} className="update-btn">Update Album Tags</button>
          </div>

          <div className="album-buttons">
            <button onClick={() => setAddTagMode(!addTagMode)}>
              {addTagMode ? "Exit Add Tag Mode" : "Add Tags"}
            </button>
            <button onClick={() => setRemoveTagMode(!removeTagMode)}>
              {removeTagMode ? "Exit Remove Tag Mode" : "Remove Tags"}
            </button>
            <button onClick={() => setAddMode(!addMode)} className="outline">
              {addMode ? "Exit Add Mode" : "Add Images"}
            </button>
            <button onClick={() => setRemoveMode(!removeMode)} className="outline">
              {removeMode ? "Exit Remove Mode" : "Remove Images"}
            </button>
            <button onClick={() => setCoverMode(!coverMode)} className="outline">
              {coverMode ? "Cancel Cover Selection" : "Set Cover Image"}
            </button>
            {coverMode && <button onClick={handleSetCover}>Save Cover</button>}
            <button onClick={handleDeleteAlbum} className="danger">Delete Album</button>
          </div>

          {addTagMode && (
            <div className="tag-mode">
              <h3>Select Tags to Add</h3>
              {allTags.map((tag) =>
                !albumTags.includes(tag) && (
                  <button key={tag} onClick={() => addTagsToAlbum(tag)}>{tag}</button>
                )
              )}
            </div>
          )}

          {removeTagMode && (
            <div className="tag-mode">
              <h3>Select Tags to Remove</h3>
              {albumTags.map((tag) => (
                <button key={tag} onClick={() => removeTagsFromAlbum(tag)}>{tag}</button>
              ))}
            </div>
          )}

          {addMode && (
            <>
              <h3>Add Images to Album</h3>
              <div className="image-grid">
                {allImages.map((img) => (
                  <div
                    key={img.id}
                    className="image-card"
                    onClick={() => addToAlbum(img.id)}
                  >
                    <img src={img.image_url || "default.jpg"} alt="All Images" />
                    <p style={{ color: "green" }}>Click to Add</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <button onClick={() => navigate(-1)} className="back-button">Go Back</button>
    </div>
  );
};

export default AlbumPage;
