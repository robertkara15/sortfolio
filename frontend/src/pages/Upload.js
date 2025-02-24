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

  // Handles image drop WITHOUT uploading images
  const onDrop = useCallback(async (acceptedFiles) => {
    const fileObjects = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: null, // Will be assigned after manual upload
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

  // Fetch AI-generated tags WITHOUT uploading the image
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

  // Uploads the image ONLY when "Finalize Upload" is clicked
  const handleFinalizeUpload = async (imageObj, index) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to upload images.");
      return;
    }

    // Collect ONLY the selected AI and custom tags
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

      // Send ONLY selected tags
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

  // Quick Upload ALL Images with AI Tags (ignores user-selected tags)
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
        // Upload the image first
        const uploadResponse = await axios.post("http://127.0.0.1:8000/images/upload/", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        const uploadedImageId = uploadResponse.data.data.id;

        // Use all 5 AI-generated tags
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

    // Remove all images from the list after upload
    setImages([]);

    // Redirect to dashboard after uploading all images
    navigate("/dashboard");
  };

  return (
    <div>
      <h2>Upload Images</h2>

      {/* Quick Upload All Button */}
      {images.length > 0 && (
        <button 
          onClick={handleQuickUploadAll} 
          style={{ marginBottom: "10px", padding: "10px", backgroundColor: "#ff4757", color: "white", border: "none", cursor: "pointer" }}>
          Quick Upload All (Ignore Selected Tags)
        </button>
      )}

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

              {aiTags[imageObj.file.name] && aiTags[imageObj.file.name].length > 0 && (
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
