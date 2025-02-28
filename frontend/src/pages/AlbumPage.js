import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

const AlbumPage = () => {
  const { albumId } = useParams();
  const [albumImages, setAlbumImages] = useState([]);
  const [coverImage, setCover] = useState(null);
  const [allImages, setAllImages] = useState([]);
  const [addMode, setAddMode] = useState(false); 
  const [removeMode, setRemoveMode] = useState(false);
  const [albumTags, setAlbumTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [addTagMode, setAddTagMode] = useState(false);
  const [removeTagMode, setRemoveTagMode] = useState(false);
  const navigate = useNavigate();




  const fetchAlbumData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      const [albumResponse, allImagesResponse, tagsResponse] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/images/album/${albumId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://127.0.0.1:8000/images/my-images/", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://127.0.0.1:8000/images/user-tags/", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setAlbumImages(albumResponse.data.images);
      setAlbumTags(albumResponse.data.tags || []);
      setCover(albumResponse.data.cover_image_url);
      setAllImages(allImagesResponse.data);
      setAllTags(tagsResponse.data.tags || []);

      console.log("📸 Album Images Fetched:", albumResponse.data.images);
      console.log("📂 All User Images:", allImagesResponse.data);
      console.log("🏷️ User Tags:", tagsResponse.data.tags);
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

      // ✅ Instead of manually adding the image, fetch the updated album images
      const response = await axios.get(`http://127.0.0.1:8000/images/album/${albumId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Updated Album Images:", response.data.images); // Debugging log
      setAlbumImages(response.data.images); // ✅ Update state with latest images

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

  const handleSetCover = async (imageId, event) => {
    if (event) event.stopPropagation();  // Prevent accidental navigation

    try {
        const token = localStorage.getItem("token");

        console.log("📡 Sending Request to Set Cover for Image ID:", imageId); // Debugging log

        const response = await axios.post(
            `http://127.0.0.1:8000/images/album/${albumId}/set-cover/`, // ✅ Ensure correct URL
            { image_id: imageId }, // ✅ Ensure payload matches backend
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("✅ Cover Image Updated Successfully:", response.data);

        if (response.data.cover_image_url) {
            setCover(response.data.cover_image_url);
        } else {
            console.warn("⚠️ Cover image URL missing in response!");
        }

        alert("Cover image updated successfully.");

        // ✅ Redirect to the dashboard after updating the cover
        navigate("/dashboard");

    } catch (error) {
        console.error("❌ Failed to set cover image:", error.response ? error.response.data : error);
        alert(`Failed to set cover image. Error: ${error.response ? JSON.stringify(error.response.data) : error}`);
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
        navigate("/dashboard"); // ✅ Redirect to the dashboard after deletion

    } catch (error) {
        console.error("❌ Failed to delete album:", error);
        alert("Failed to delete album.");
    }
};

const [updateTrigger, setUpdateTrigger] = useState(false);

const triggerUpdate = () => setUpdateTrigger(prev => !prev);

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
    console.error("❌ Failed to add tag:", error);
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
      console.log("✅ Updated Album Tags:", response.data.tags);
      setAlbumTags([...response.data.tags]);  // ✅ Update album tags
    }

    if (response.data.images) {
      console.log("✅ Updated Album Images:", response.data.images);
      setAlbumImages([...response.data.images]);  // ✅ Update album images
    }

    fetchAlbumData(); 

  } catch (error) {
    console.error("❌ Failed to remove tag:", error);
  }
};






useEffect(() => {
  fetchAlbumData();
}, [fetchAlbumData, updateTrigger]);

  

  return (
    <div>
      <h2>My Albums</h2>
      
      {coverImage && (
        <div>
          <h3>Cover Image</h3>
          <img src={coverImage} alt="Cover" width="200" />
        </div>
      )}

      {/* Album Tags */}
      <h3>Album Tags</h3>
      {albumTags.length > 0 ? (
        albumTags.map((tag) => (
          <span key={tag} style={{ marginRight: "10px", background: "#ddd", padding: "5px" }}>
            {tag}
          </span>
        ))
      ) : (
        <p>No tags in this album.</p>
      )}

      {/* Tag Management Buttons */}
      <button onClick={() => setAddTagMode(!addTagMode)}>
          {addTagMode ? "Exit Add Tag Mode" : "Add Tags"}
      </button>
      <button onClick={() => setRemoveTagMode(!removeTagMode)}>
          {removeTagMode ? "Exit Remove Tags Mode" : "Remove Tags"}
      </button>

      {/* Add Tags Mode */}
      {addTagMode && (
          <div>
              <h3>Select Tags to Add</h3>
              {allTags.map((tag) => (
                  !albumTags.includes(tag) && ( // ✅ Prevent duplicate additions
                      <button key={tag} onClick={() => addTagsToAlbum(tag)}>{tag}</button>
                  )
              ))}
          </div>
      )}


      {/* Remove Tags Mode */}
      {removeTagMode && (
        <div>
          <h3>Select Tags to Remove</h3>
          {albumTags.map((tag) => (
            <button key={tag} onClick={() => removeTagsFromAlbum([tag])}>{tag}</button>
          ))}
        </div>
      )}

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


    {/* ✅ Toggle Buttons for Modes */}
      <button onClick={() => { setAddMode(!addMode); setRemoveMode(false); }}>
        {addMode ? "Exit Add Mode" : "Add Images to Album"}
      </button>
      <button onClick={() => { setRemoveMode(!removeMode); setAddMode(false); }}>
        {removeMode ? "Exit Remove Mode" : "Remove Images from Album"}
      </button>

    {/* ✅ Album Images (Clickable) */}
    <h3>Album Images</h3>
    <div style={{ display: "flex", flexWrap: "wrap" }}>
    {albumImages && albumImages.length > 0 ? (
        albumImages.map((img) => (
        <div 
            key={img.id} 
            style={{ margin: "10px", cursor: "pointer", padding: "10px", border: removeMode ? "2px solid red" : "1px solid #ddd" }}
            onClick={() => removeMode ? removeFromAlbum(img.id) : navigate(`/image/${img.id}`)}
        >
            <img 
            src={img.image_url || "default.jpg"}  
            alt="Album Content" 
            width="150" 
            onError={(e) => e.target.src = "default.jpg"} 
            />
            <button onClick={(event) => handleSetCover(img.id, event)}>Set as Cover</button>
            {removeMode && <p style={{ color: "red" }}>Click to Remove</p>}
        </div>
        ))
    ) : (
        <p>No images in this album.</p>
    )}
    </div>



      {/* ✅ Add Images Mode */}
      {addMode && (
        <>
          <h3>Add Images to Album</h3>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {allImages.map((img) => (
              <div 
                key={img.id} 
                style={{ margin: "10px", cursor: "pointer", padding: "10px", border: "1px solid green" }}
                onClick={() => addToAlbum(img.id)} // ✅ Clicking an image adds it to the album
              >
                <img 
                  src={img.image_url || "default.jpg"}  // ✅ Ensure valid image URL
                  alt="All Images" 
                  width="150" 
                  onError={(e) => e.target.src = "default.jpg"} // ✅ Fallback for broken images
                />
                <p style={{ color: "green" }}>Click to Add</p>
              </div>
            ))}
          </div>
        </>
      )}

      <button onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );
};

export default AlbumPage;
