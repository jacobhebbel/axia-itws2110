# Portfolio Analysis & Financial Data Platform
### Created by: Samantha Steenbruggen, Jacob Hebbel, Jake Collen, Ryan Thomas, Matthew Lifrieri

### Overview: 
Axia is a free, user-friendly educational platform designed to democratize access to financial knowledge by simplifying complex market concepts and providing clear, actionable insights. Traditional financial markets often feel closed-off and intimidating due to jargon, misinformation, and high barriers to entry. Axia bridges this gap by offering intuitive tools for locating key market indicators, visualizing data, and building investor confidence. Our mission is to empower users of all backgrounds to take their first steps toward long-term financial security through informed investing.

### Motivation:
Financial literacy should be accessible to everyone, not just experts. Axia was born from the recognition that complexity and intimidation prevent many from engaging with markets. By providing free, clear, and trustworthy educational tools, we aim to promote financial inclusion and help users build confidence in managing their investments. Our platform transforms raw data into understandable insights, enabling users to make informed decisions without prior expertise.

## Key Features
### Educational Market Tools:
- Customizable dashboards for viewing relevant market data and indicators
- Interactive charts and tables that render real-time and historical financial data
- Simplified explanations of market concepts to reduce the learning curve

### Powerful Data Processing:
- Efficient backend architecture using Python (Flask) for executing NumPy-based data scripts
- Index 2TB+ of stock data, fast
- Server-side caching mechanisms that improve load times by up to 80%
- Integration with reliable financial data APIs (e.g., yFinance) for accurate, up-to-date information

### Optimized User Experience:
- Responsive frontend built with reusable UI components for consistent styling
- Loading states, error handling, and user feedback for smooth interactions
- Performance-optimized rendering of charts and data visualizations

## Technical Architecture
Axia employs a modular two-server architecture for scalability and efficiency:
- Frontend Server: Node.js (Express.js) serving the website to clients
- Backend Server: Python (Flask) executing data processing scripts with NumPy and managing caching

This separation allows for horizontal scaling, stateless design, and easy integration with external APIs. Security measures include request limiting by IP address to prevent abusive behavior.

## Performance Optimizations
Initial load times of 15 seconds were dramatically reduced through strategic improvements:
- Dual-Server Architecture: Moving Python processing to a Flask server reduced load time to 9 seconds
- Intelligent Caching: Implementing server-side caching with efficient miss protocols resulted in 80% faster load times
- Vectorized Operations: Leveraging NumPy's C binaries for rapid data processing
- Multithreading: Executing blocking calls concurrently to minimize wait times

## Tech Stack
- Frontend: HTML/CSS, JavaScript, React (with reusable component library)
- Backend: Node.js (Express), Python (Flask, NumPy, yFinance)
- Data Processing: NumPy for vectorized operations, custom caching layer
- Deployment: Docker, cloud hosting (AWS/GCP compatible)
- APIs: Integrated financial data sources with secure endpoint exposure