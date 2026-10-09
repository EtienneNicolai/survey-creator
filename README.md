# Survey Creator

A web app for building and sharing surveys. Create an account, build a survey with drag-and-drop questions, share a link with anyone, and watch results come in live.

## Using the app

The app is hosted at: [survey-creator-5fkr.onrender.com](https://survey-creator-5fkr.onrender.com)

It runs on a free hosting plan that sleeps when idle, so the first load can take up to a minute.

### As a survey creator
1. **Register** create an account with your email and password
2. **Create a survey** click **+ New Survey**, give it a title and optional description
3. **Build it** click **Builder** to open the drag-and-drop editor
   - Click **+ Add** to add questions (NPS, Rating, Multiple Choice, or Open Text)
   - Drag questions up and down to reorder them
   - Click a question to edit its label, options, or scale
4. **Share it** on the dashboard, click **Copy link** next to your survey and send it to anyone
5. **View results** click **Results** to see live charts as responses come in
6. **Toggle active/inactive** use the **Activate / Deactivate** button to open or close a survey to new responses

### As a respondent (no account needed)
Open the link you were sent, answer the questions, and click **Submit**. That's it.


## Question types

| Type | What it collects |
|---|---|
| **NPS** | A 0–10 score. Results show NPS score, promoter/passive/detractor breakdown |
| **Rating** | A 1–5 or 1–10 scale. Results show mean, median, and distribution chart |
| **Multiple Choice** | Pick one option from a list. Results show a bar chart of counts |
| **Open Text** | Free-text response. Results show a scrollable list of all answers |

## Running locally

### Requirements
- Python 3.11+
- Node.js 18+

### Setup
```bash
# 1. Install Python packages
python -m pip install --target=backend\lib -r requirements.txt

# 2. Install and build frontend
cd frontend
npm install
npm run build
cd ..
```

### Start
Double-click `start.bat` the app opens at http://localhost:8000


## Deploying your own instance

1. Fork this repo on GitHub
2. Create a free PostgreSQL database on [Neon](https://neon.tech) and copy its connection string
3. On [Render](https://render.com), choose **New**, then **Blueprint**, and connect your fork
4. Paste the Neon connection string as `DATABASE_URL` when prompted (`SECRET_KEY` is generated for you)
5. Render builds the Docker image and deploys automatically, and you get a public URL

The app uses SQLite locally and switches to PostgreSQL automatically when the `DATABASE_URL` environment variable is set.
