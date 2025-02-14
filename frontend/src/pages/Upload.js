import React, { useState } from "react";
import axios from "axios";

function Upload() {
  const [image, setImage] = useState(null);
  const [tags, setTags] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("image", image);
    formData.append("tags", JSON.stringify(tags.split(",")));

    try {
      await axios.post("http://127.0.0.1:8000/images/upload/", formData, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Image uploaded successfully!");
    } catch (error) {
      alert("Upload failed: " + error.response.data.error);
    }
  };

  return (
    <div>
      <h2>Upload Image</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={(e) => setImage(e.target.files[0])} required />
        <input type="text" placeholder="Enter tags (comma separated)" onChange={(e) => setTags(e.target.value)} />
        <button type="submit">Upload</button>
      </form>
    </div>
  );
}

export default Upload;
