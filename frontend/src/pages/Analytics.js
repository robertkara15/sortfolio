import axios from "axios";
import { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import { useNavigate } from "react-router-dom";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      navigate("/login");
      return;
    }

    const fetchAnalytics = async () => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
        console.error("No token found. User may not be logged in.");
        return;
        }

        const response = await axios.get("http://127.0.0.1:8000/images/analytics/", {
        headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Analytics Data:", response.data);
        setAnalyticsData(response.data);
    } catch (error) {
        console.error("Failed to fetch analytics:", error.response ? error.response.data : error);
        }
    };

    fetchAnalytics();
  }, []);

  if (!analyticsData) return <p>Loading analytics...</p>;

  const { total_images, top_tags, tag_distribution } = analyticsData;

  // Bar Chart Data (Images per Tag)
  const barChartData = {
    labels: top_tags.length > 0 ? top_tags.map((tag) => tag[0]) : ["No Data"],
    datasets: [
      {
        label: "Images per Tag",
        data: top_tags.length > 0 ? top_tags.map((tag) => tag[1]) : [0],
        backgroundColor: ["#ff6384", "#36a2eb", "#ffce56", "#4caf50", "#9966ff"],
      },
    ],
  };

  // Pie Chart Data (Tag Distribution)
  const pieChartData = {
    labels: tag_distribution.map((entry) => entry.tag),
    datasets: [
      {
        data: tag_distribution.map((entry) => entry.count),
        backgroundColor: ["#ff6384", "#36a2eb", "#ffce56", "#4caf50", "#9966ff"],
      },
    ],
  };

  return (
    <div>
      <h2>Image Analytics</h2>
      
      {/* Total Images Uploaded */}
      <h3>Total Images Uploaded: {total_images}</h3>

      {/* Bar Chart: Top 5 Most Used Tags */}
      <div style={{ width: "50%", margin: "auto" }}>
        <h3>Top 5 Most Used Tags</h3>
        <Bar data={barChartData} />
      </div>

      {/* Pie Chart: Tag Distribution */}
      <div style={{ width: "50%", margin: "auto", marginTop: "20px" }}>
        <h3>Tag Distribution</h3>
        <Pie data={pieChartData} />
      </div>
    </div>
  );
};

export default Analytics;
