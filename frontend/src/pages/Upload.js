import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import axios from "axios";

const suggestedTags = ["Portrait", "Nature", "Cityscape", "Black & White", "Night"];

function Upload() {
  const [images, setImages] = useState([]);
  const [selectedTags, setSelectedTags] = useState({});
  const [customTags, setCustomTags] = useState({});
  const navigate = useNavigate(); // Initialize navigation hook

  // Handle file selection
  const onDrop = useCallback((acceptedFiles) => {
    const fileObjects = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...fileObjects]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: "image/*",
    multiple: true,
  });

  // Handle selection of suggested tags
  const toggleSuggestedTag = (imageName, tag) => {
    setSelectedTags((prev) => {
      const tags = prev[imageName] || [];
      if (tags.includes(tag)) {
        return { ...prev, [imageName]: tags.filter((t) => t !== tag) };
      } else if (tags.length < 5) {
        return { ...prev, [imageName]: [...tags, tag] };
      }
      return prev;
    });
  };

  // Handle custom tag input
  const handleTagInput = (imageName, tagText) => {
    const tags = tagText.split(",").map(tag => tag.trim()).slice(0, 5);
    setCustomTags((prev) => ({ ...prev, [imageName]: tags }));
  };

  // Upload images to backend
  const handleUpload = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to upload images.");
      return;
    }

    for (const imageObj of images) {
      const formData = new FormData();
      formData.append("image", imageObj.file);

      // Combine selected and custom tags
      const combinedTags = [
        ...(selectedTags[imageObj.file.name] || []),
        ...(customTags[imageObj.file.name] || [])
      ];

      formData.append("tags", JSON.stringify(combinedTags)); // Send tags as JSON string

      try {
        await axios.post("http://127.0.0.1:8000/images/upload/", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

      } catch (error) {
        console.error("Upload failed:", error);
      }
    }

    // Redirect to dashboard after upload
    navigate("/dashboard");

    // Clear images & tags from UI
    setImages([]);
    setSelectedTags({});
    setCustomTags({});
  };

  return (
    <div>
      <h2>Upload Images</h2>

      {/* Dropzone for file selection */}
      <div {...getRootProps()} style={dropzoneStyle}>
        <input {...getInputProps()} />
        {isDragActive ? <p>Drop the files here...</p> : <p>Drag & drop images here, or click to select</p>}
      </div>

      {/* Preview selected images before upload */}
      {images.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", marginTop: "10px" }}>
          {images.map((imageObj, index) => (
            <div key={index} style={{ margin: "10px", padding: "10px", border: "1px solid #ddd" }}>
              <img src={imageObj.preview} alt="Preview" style={{ width: "150px", height: "150px", objectFit: "cover" }} />
              <p>{imageObj.file.name}</p>

              {/* Suggested Tags Selection */}
              <div>
                <p>Suggested Tags:</p>
                {suggestedTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleSuggestedTag(imageObj.file.name, tag)}
                    style={{
                      margin: "5px",
                      padding: "5px",
                      border: selectedTags[imageObj.file.name]?.includes(tag) ? "2px solid green" : "1px solid #ccc",
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Custom Tag Input */}
              <input
                type="text"
                placeholder="Enter custom tags (comma-separated)"
                onChange={(e) => handleTagInput(imageObj.file.name, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <button onClick={handleUpload} disabled={images.length === 0} style={uploadButtonStyle}>
        Upload Images
      </button>
    </div>
  );
}

// Styles
const dropzoneStyle = {
  border: "2px dashed #ccc",
  padding: "20px",
  textAlign: "center",
  cursor: "pointer",
  backgroundColor: "#f9f9f9",
};

const uploadButtonStyle = {
  padding: "10px",
  fontSize: "16px",
  marginTop: "20px",
  cursor: "pointer",
};

export default Upload;
