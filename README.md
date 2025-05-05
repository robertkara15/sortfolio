# Sortfolio by Robert Karapetian

Sortfolio is a web-based photography portfolio application designed to 
automate image classification using Convolutional Neural Networks (CNNs). 
It allows photographers to upload, organise, and share their work effortlessly 
using AI-generated hashtags and semantic album grouping.

## Key Features

- Batch image uploads
- Automatic hashtag generation using CNNs
- Dynamic album creation with vector embeddings
- Public profiles and album sharing
- Explore page to discover other portfolios
- Secure user authentication

## Tech Stack

- **Frontend:** React.js
- **Backend:** Django
- **ML/AI:** Amazon Rekognition API, Sentence-BERT (all-MiniLM-L6-v2)
- **Database:** PostgreSQL
- **Cloud Storage:** AWS S3

---

## Getting Started

To run the application locally, follow the steps below for both backend and frontend setup.

### 1. Clone the repository

```bash
git clone https://github.com/your-username/sortfolio.git
cd sortfolio
```
### 2. Backend Setup

```bash
cd backend
python -m venv sortfolio_env
source sortfolio_env/bin/activate  # On Windows: sortfolio_env\Scripts\activate
pip install -r requirements.txt
```
Set environment variables by creating a `.env` file in the backend root:

```ini
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_STORAGE_BUCKET_NAME=
```

Then, apply migrations and start the backend server:

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm start
```

The frontend will be available at `http://localhost:3000` and will proxy requests to the backend at `http://localhost:8000`.









