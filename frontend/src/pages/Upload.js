// This page allows users to drag and drop images, generate AI tags, select or add custom tags,
// and upload images to the server with finalised tags.

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Upload.css";

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

  // Handles image drop without uploading images
  const onDrop = useCallback(async (acceptedFiles) => {
    const fileObjects = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: null,
    }));

    setImages((prev) => [...prev, ...fileObjects]);

    // Fetch AI tags immediately without uploading the image
    for (const fileObj of fileObjects) {
      const tags = await getAiTagsForImage(fileObj.file);
      if (tags.length > 0) {
        setAiTags((prev) => ({
          ...prev,
          [fileObj.file.name]: tags,
        }));
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: "image/*",
    multiple: true,
  });

  // Fetch AI-generated tags without uploading the image
  const getAiTagsForImage = async (imageFile) => {
    const token = localStorage.getItem("token");
    if (!token) return [];

    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const response = await axios.post("http://127.0.0.1:8000/images/generate-tags/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data.tags || [];
    } catch (error) {
      console.error("Error fetching AI tags:", error);
      return [];
    }
  };

  const toggleTag = (imageName, tag) => {
    setSelectedTags((prev) => {
      const tags = prev[imageName] || [];
      return {
        ...prev,
        [imageName]: tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag],
      };
    });
  };

  const handleTagInput = (imageName, tagText) => {
    const tags = tagText.split(",").map((tag) => tag.trim()).slice(0, 5);
    setCustomTags((prev) => ({ ...prev, [imageName]: tags }));
  };

  // Uploads the image only when upload is finalised
  const handleFinalizeUpload = async (imageObj, index) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to upload images.");
      return;
    }

    const finalTags = [
      ...(selectedTags[imageObj.file.name] || []),
      ...(customTags[imageObj.file.name] || [])
    ];

    if (finalTags.length === 0) {
      alert("Please select at least one tag before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("image", imageObj.file);

    try {
      // Upload the image first
      const uploadResponse = await axios.post("http://127.0.0.1:8000/images/upload/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedImageId = uploadResponse.data.data.id;

      // Send only selected tags
      await axios.post("http://127.0.0.1:8000/images/finalize-upload/", {
        image_id: uploadedImageId,
        tags: finalTags,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove uploaded image from the list
      setImages((prevImages) => prevImages.filter((_, i) => i !== index));

      // Redirect to dashboard when the last image is uploaded
      if (images.length === 1) {
        navigate("/dashboard");
      }

    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  // Quick upload all images with AI tags (ignores user-selected tags)
  const handleQuickUploadAll = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to upload images.");
      return;
    }

    for (const imageObj of images) {
      const formData = new FormData();
      formData.append("image", imageObj.file);

      try {
        const uploadResponse = await axios.post("http://127.0.0.1:8000/images/upload/", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        const uploadedImageId = uploadResponse.data.data.id;
        const finalTags = aiTags[imageObj.file.name] || [];

        await axios.post("http://127.0.0.1:8000/images/finalize-upload/", {
          image_id: uploadedImageId,
          tags: finalTags,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });

      } catch (error) {
        console.error("Quick Upload failed for an image:", error);
      }
    }
    setImages([]);

    navigate("/dashboard");
  };

  return (
    <div className="upload-container">
      <h2 className="upload-title">Upload Images</h2>

      {images.length > 0 && (
        <button className="quick-upload-btn" onClick={handleQuickUploadAll}>
          Quick Upload All (Ignore Selected Tags)
        </button>
      )}

      <div {...getRootProps()} className="dropzone">
        <input {...getInputProps()} />
        {isDragActive ? <p>Drop the files here...</p> : <p>Drag & drop images here, or click to select</p>}
      </div>

      {images.length > 0 && (
        <div className="image-grid">
          {images.map((imageObj, index) => (
            <div key={index} className="image-card">
              <img src={imageObj.preview} alt="Preview" />
              <p>{imageObj.file.name}</p>

              {aiTags[imageObj.file.name] && aiTags[imageObj.file.name].length > 0 && (
                <div>
                  <p>Select Tags:</p>
                  {aiTags[imageObj.file.name].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(imageObj.file.name, tag)}
                      className={`tag-button ${selectedTags[imageObj.file.name]?.includes(tag) ? "selected" : ""}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              <input
                type="text"
                className="custom-tag-input"
                placeholder="Enter custom tags"
                onChange={(e) => handleTagInput(imageObj.file.name, e.target.value)}
              />

              <button className="finalize-btn" onClick={() => handleFinalizeUpload(imageObj, index)}>
              Finalise Upload
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Upload;
