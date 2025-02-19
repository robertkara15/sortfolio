import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Upload() {
  const [images, setImages] = useState([]);
  const [aiTags, setAiTags] = useState({});
  const [selectedTags, setSelectedTags] = useState({});
  const [customTags, setCustomTags] = useState({});
  const navigate = useNavigate();

  const dropzoneStyle = {
    border: "2px dashed #ccc",
    padding: "20px",
    textAlign: "center",
    cursor: "pointer",
    backgroundColor: "#f9f9f9",
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to upload images.");
      return;
    }

    const fileObjects = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: null, // Will be assigned after final upload
    }));

    setImages((prev) => [...prev, ...fileObjects]);

    // Fetch AI tags immediately without uploading the image
    for (const fileObj of fileObjects) {
      const formData = new FormData();
      formData.append("image", fileObj.file);

      try {
        const response = await axios.post(
          "http://127.0.0.1:8000/images/upload/", 
          formData, 
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        setAiTags((prev) => ({
          ...prev,
          [fileObj.file.name]: response.data.data.tags,
        }));

      } catch (error) {
        console.error("AI tag fetch failed:", error);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: "image/*",
    multiple: true,
  });

  const toggleTag = (imageName, tag) => {
    setSelectedTags((prev) => {
      const tags = prev[imageName] || [];
      if (tags.includes(tag)) {
        return { ...prev, [imageName]: tags.filter((t) => t !== tag) };
      } else {
        return { ...prev, [imageName]: [...tags, tag] };
      }
    });
  };

  const handleTagInput = (imageName, tagText) => {
    const tags = tagText.split(",").map(tag => tag.trim()).slice(0, 5);
    setCustomTags((prev) => ({ ...prev, [imageName]: tags }));
  };

  const handleFinalizeUpload = async (imageObj, index) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to finalize image.");
      return;
    }

    const finalTags = [
      ...(selectedTags[imageObj.file.name] || []),
      ...(customTags[imageObj.file.name] || []),
    ];

    const formData = new FormData();
    formData.append("image", imageObj.file);

    try {
      // Upload the image along with final tags
      const response = await axios.post(
        "http://127.0.0.1:8000/images/finalize-upload/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setImages((prevImages) => prevImages.filter((_, i) => i !== index));

      // Redirect to dashboard when all images are uploaded
      if (images.length === 1) {
        navigate("/dashboard");
      }

    } catch (error) {
      console.error("Finalization failed:", error);
    }
  };

  return (
    <div>
      <h2>Upload Images</h2>

      <div {...getRootProps()} style={dropzoneStyle}>
        <input {...getInputProps()} />
        {isDragActive ? <p>Drop the files here...</p> : <p>Drag & drop images here, or click to select</p>}
      </div>

      {images.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", marginTop: "10px" }}>
          {images.map((imageObj, index) => (
            <div key={index} style={{ margin: "10px", padding: "10px", border: "1px solid #ddd" }}>
              <img src={imageObj.preview} alt="Preview" style={{ width: "150px", height: "150px", objectFit: "cover" }} />
              <p>{imageObj.file.name}</p>

              {aiTags[imageObj.file.name] && (
                <div>
                  <p>Select Tags:</p>
                  {aiTags[imageObj.file.name].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(imageObj.file.name, tag)}
                      style={{
                        margin: "5px",
                        padding: "5px",
                        border: selectedTags[imageObj.file.name]?.includes(tag) ? "2px solid green" : "1px solid #ccc",
                        backgroundColor: selectedTags[imageObj.file.name]?.includes(tag) ? "#d4edda" : "#fff",
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              <input type="text" placeholder="Enter custom tags" onChange={(e) => handleTagInput(imageObj.file.name, e.target.value)} />

              <button onClick={() => handleFinalizeUpload(imageObj, index)}>Finalize Upload</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Upload;
