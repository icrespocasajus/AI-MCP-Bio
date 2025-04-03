import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage = () => {
  const [activeCategory, setActiveCategory] = useState('Popular');

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
  };

  return (
    <div className="home-page">
      <header>
        <div className="logo">AI-MCP-Bio Platform</div>
        <nav>
          <a href="#">Home</a>
          <a href="#">Documentation</a>
          <a href="#">MCP Servers</a>
          <a href="#">Get Started</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <h1>Connect Your AI to Bioinformatics Tools</h1>
          <p>The fastest way to let your AI assistant interact with specialized bioinformatics tools and services. No complex API integrations required.</p>
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary">Get Started</Link>
            <Link to="/docs" className="btn btn-secondary">Learn More</Link>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Platform Features</h2>
          <div className="container">
            <div className="card">
              <div className="card-icon">🧬</div>
              <h3>Expand AI Capabilities</h3>
              <p>Go beyond text generation. Our MCP connects your AI to real-world bioinformatics tools across our ecosystem.</p>
            </div>
            <div className="card">
              <div className="card-icon">⚡</div>
              <h3>High-Performance Computing</h3>
              <p>Integration with HPC clusters for computationally intensive genomic and proteomic analysis tasks.</p>
            </div>
            <div className="card">
              <div className="card-icon">🔒</div>
              <h3>Secure and Reliable</h3>
              <p>Focus on your research while we handle authentication, API limits, and security for all your integrations.</p>
            </div>
          </div>
        </section>

        <section className="section mcp-servers">
          <h2 className="section-title">MCP Servers</h2>
          <div className="categories">
            <div 
              className={`category ${activeCategory === 'Popular' ? 'active' : ''}`} 
              onClick={() => handleCategoryClick('Popular')}
            >
              Popular
            </div>
            <div 
              className={`category ${activeCategory === 'Genomics' ? 'active' : ''}`}
              onClick={() => handleCategoryClick('Genomics')}
            >
              Genomics
            </div>
            <div 
              className={`category ${activeCategory === 'Proteomics' ? 'active' : ''}`}
              onClick={() => handleCategoryClick('Proteomics')}
            >
              Proteomics
            </div>
            <div 
              className={`category ${activeCategory === 'Phylogenetics' ? 'active' : ''}`}
              onClick={() => handleCategoryClick('Phylogenetics')}
            >
              Phylogenetics
            </div>
            <div 
              className={`category ${activeCategory === 'Utilities' ? 'active' : ''}`}
              onClick={() => handleCategoryClick('Utilities')}
            >
              Utilities
            </div>
          </div>
          
          <div className="server-container">
            <div className="server-card">
              <div className="server-logo">🌤️</div>
              <div className="server-info">
                <h3>Weather MCP</h3>
                <p>Provides weather forecasts and alerts through the National Weather Service API. Get weather alerts for any US state or forecasts for any location.</p>
                <div className="server-tags">
                  <div className="tag">weather</div>
                  <div className="tag">alerts</div>
                  <div className="tag">forecasts</div>
                  <div className="tag">utilities</div>
                </div>
              </div>
            </div>
            
            {/* Placeholder for future servers */}
            <div className="server-card">
              <div className="server-logo">🧬</div>
              <div className="server-info">
                <h3>Genomics Analysis MCP</h3>
                <p>Connect to popular genomics tools like BLAST, BWA, and GATK for sequence analysis and variant calling.</p>
                <div className="server-tags">
                  <div className="tag">genomics</div>
                  <div className="tag">sequence analysis</div>
                  <div className="tag">coming soon</div>
                </div>
              </div>
            </div>
            
            <div className="server-card">
              <div className="server-logo">🔄</div>
              <div className="server-info">
                <h3>Workflow Engine MCP</h3>
                <p>Integration with scientific workflow engines like Galaxy and Nextflow for complex bioinformatics pipelines.</p>
                <div className="server-tags">
                  <div className="tag">workflows</div>
                  <div className="tag">pipelines</div>
                  <div className="tag">coming soon</div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="section how-it-works">
          <h2 className="section-title">How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Generate your MCP endpoint</h3>
                <p>Get your unique, dynamic MCP server URL instantly. This endpoint securely connects your AI assistant to our vast integration network.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Configure your Actions</h3>
                <p>Easily select and scope the specific actions your AI can perform, ensuring precise control over tool capabilities.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Connect your AI Assistant</h3>
                <p>Integrate your AI Assistant seamlessly using your generated MCP endpoint, enabling immediate execution of bioinformatics tasks securely and reliably.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <p>&copy; 2023 AI-MCP-Bio: Model Context Protocol Platform for Advanced Bioinformatics. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;