# UI Design Plants

A user interface design application focusing on plant visualization and organization.

## Prerequisites

You'll need Python installed on your computer. The application works with either Python 2 or Python 3.

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/tvytran/UIDesignPlants.git
   cd UIDesignPlants
   ```

2. **Run the application**

   Simply run the Python server file:

   ```bash
   python server.py
   ```

   Or if you're using Python 3:

   ```bash
   python3 server.py
   ```

   The application should now be running locally. Open your browser and navigate to http://127.0.0.1:5001

## Deployment to Vercel

This application is configured for deployment on Vercel. To deploy:

1. **Install Vercel CLI** (optional but recommended):
   ```bash
   npm install -g vercel
   ```

2. **Deploy using Vercel CLI**:
   ```bash
   vercel
   ```

3. **Or deploy via GitHub**:
   - Push your code to GitHub
   - Connect your repository to Vercel at [vercel.com](https://vercel.com)
   - Vercel will automatically deploy your application

The application includes all necessary configuration files:
- `vercel.json` - Vercel deployment configuration
- `requirements.txt` - Python dependencies
- `runtime.txt` - Python version specification
