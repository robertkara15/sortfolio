import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const [albums, setAlbums] = useState([]);
  const [images, setImages] = useState([]);
  const [removeImageMode, setRemoveImageMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("latest");
  const [filterTag, setFilterTag] = useState("All");
  const [allTags, setAllTags] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const [albumsRes, imagesRes, tagsRes] = await Promise.all([
          axios.get("http://127.0.0.1:8000/images/albums/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://127.0.0.1:8000/images/my-images/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://127.0.0.1:8000/images/user-tags/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setAlbums(albumsRes.data);
        setImages(imagesRes.data);
        setAllTags(["All", ...tagsRes.data.tags]);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchData();
  }, [navigate]);

  const createNewAlbum = async () => {
    const albumName = prompt("Enter album name:");
    if (!albumName) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://127.0.0.1:8000/images/create-album/",
        { name: albumName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Album created!");
      navigate(`/album/${res.data.album_id}`);
    } catch (error) {
      console.error("Album creation failed:", error);
    }
  };

  const deleteImage = async (imageId) => {
    const confirmDelete = window.confirm("Delete this image?");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      setImages((prev) =>
        prev.map((img) => (img.id === imageId ? { ...img, deleting: true } : img))
      );

      await axios.delete(`http://127.0.0.1:8000/images/delete-image/${imageId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  // Image filtering and sorting
  const filteredImages = images
    .filter((img) =>
      img.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      img.image_url.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((img) => filterTag === "All" || img.tags.includes(filterTag))
    .sort((a, b) => {
      if (sortOption === "latest") {
        return new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0);
      }
      if (sortOption === "earliest") {
        return new Date(a.uploaded_at || 0) - new Date(b.uploaded_at || 0);
      }
      if (sortOption === "az") {
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortOption === "za") {
        return (b.name || "").localeCompare(a.name || "");
      }
      return 0;
    });

  const filteredAlbums = albums.filter((album) =>
    album.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Dashboard</h2>

      <div className="dashboard-buttons">
        <button className="upload-btn" onClick={() => navigate("/upload")}>Upload Image</button>
        <button className="remove-btn" onClick={() => setRemoveImageMode(!removeImageMode)}>
          {removeImageMode ? "Exit Remove Mode" : "Remove Images"}
        </button>
        <button className="create-album-btn" onClick={createNewAlbum}>Create New Album</button>
      </div>

      {/* Search & Sort */}
      <div className="dashboard-controls">
        <input
          className="dashboard-search"
          type="text"
          placeholder="Search images & albums..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
          <option value="latest">Sort by: Latest</option>
          <option value="earliest">Sort by: Earliest</option>
          <option value="az">Sort by: A-Z</option>
          <option value="za">Sort by: Z-A</option>
        </select>

        <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>

      <h2 className="dashboard-title">My Albums</h2>
      <div className="albums-grid">
        {filteredAlbums.map((album) => (
          <div key={album.id} className="album-card" onClick={() => navigate(`/album/${album.id}`)}>
            <p>{album.name}</p>
            <img src={album.cover_image_url || "default.jpg"} alt="Album Cover" />
          </div>
        ))}
      </div>

      <h2 className="dashboard-title">My Images</h2>
      <div className="images-grid">
        {filteredImages.map((img) => (
          <div
            key={img.id}
            className="image-card"
            style={{ position: "relative" }}
            onClick={() => !removeImageMode && navigate(`/image/${img.id}`)}
          >
            <img src={img.image_url} alt="Uploaded" />
            {removeImageMode && (
              <button className="remove-image-btn" onClick={(e) => {
                e.stopPropagation();
                deleteImage(img.id);
              }}>X</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
