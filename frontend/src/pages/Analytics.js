// This page provides insights into user-uploaded images, including tag distribution
// and the most frequently used tags, displayed using bar and pie charts.

import axios from "axios";
import { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import { useNavigate } from "react-router-dom";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import "../styles/Analytics.css";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ChartDataLabels);

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/images/analytics/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setAnalyticsData(response.data);
      } catch (error) {
        console.error("Failed to fetch analytics:", error.response ? error.response.data : error);
      }
    };

    fetchAnalytics();
  }, [navigate]);

  if (!analyticsData) return <p className="loading-text">Loading analytics...</p>;

  const { total_images, top_tags, tag_distribution } = analyticsData;

  const barChartData = {
    labels: top_tags.length > 0 ? top_tags.map((tag) => tag[0]) : ["No Data"],
    datasets: [
      {
        label: "Images per Tag",
        data: top_tags.length > 0 ? top_tags.map((tag) => tag[1]) : [0],
        backgroundColor: top_tags.map((_, i) => `hsl(${i * 60}, 70%, 50%)`),
      },
    ],
  };

  const barChartOptions = {
    plugins: {
      datalabels: {
        anchor: "center",
        align: "center",
        formatter: (value) => value, 
        font: { weight: "bold", size: 14 },
        color: "white",
      },
    },
  };

  const sortedTags = [...tag_distribution].sort((a, b) => b.count - a.count);
  const topTags = sortedTags.slice(0, 10);
  const othersCount = sortedTags.slice(10).reduce((sum, entry) => sum + entry.count, 0);

  const pieChartData = {
    labels: [...topTags.map(entry => entry.tag), "Others"],
    datasets: [
      {
        data: [...topTags.map(entry => entry.count), othersCount],
        backgroundColor: topTags.map((_, i) => `hsl(${i * 30}, 70%, 50%)`).concat("#999"),
      },
    ],
  };

  return (
    <div className="analytics-container">
      <h2 className="analytics-title">Image Analytics</h2>

      <h3 className="total-uploads">Total Images Uploaded: {total_images}</h3>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Top 5 Most Used Tags</h3>
          <Bar data={barChartData} options={barChartOptions} />
        </div>

        <div className="chart-card">
          <h3>Tag Distribution</h3>
          <Pie data={pieChartData} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
