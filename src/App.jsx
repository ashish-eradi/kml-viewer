// App.jsx
import { useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import * as turf from '@turf/turf';
import toGeoJSON from 'togeojson';
import './App.css';

function App() {
  const [geoJson, setGeoJson] = useState(null);
  const [summary, setSummary] = useState(null);
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file.name.endsWith('.kml')) {
      setError('Please upload a valid KML file');
      return;
    }
    setError(null);
    setIsLoading(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const kml = new DOMParser().parseFromString(event.target.result, 'text/xml');
        const geojson = toGeoJSON.kml(kml);
        setGeoJson(geojson);
      } catch (err) {
        setError('Error parsing KML file');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="app">
      <div className="main-container">
        <h1 className="title">KML Viewer</h1>
        
        <div className="upload-section">
          <input 
            type="file" 
            onChange={handleFileUpload} 
            accept=".kml" 
            id="kml-upload"
          />
          <label htmlFor="kml-upload" className="upload-btn">
            {isLoading ? 'Loading...' : 'Upload KML File'}
          </label>
          {error && <div className="error-message">{error}</div>}
        </div>

        {geoJson && (
          <>
            <div className="controls">
              <button 
                className="btn primary"
                onClick={() => {
                  setSummary(null);
                  setDetails(null);
                }}
              >
                Reset
              </button>
              <button 
                className="btn secondary"
                onClick={() => setSummary(geoJson)}
              >
                Show Summary
              </button>
              <button 
                className="btn tertiary"
                onClick={() => setDetails(geoJson)}
              >
                Show Details
              </button>
            </div>

            <div className="content">
              <div className="data-panel">
                {summary && (
                  <div className="card">
                    <h3>Element Summary</h3>
                    <table>
                      <tbody>
                        {Object.entries(summary.features.reduce((acc, feat) => {
                          const type = feat.geometry.type;
                          acc[type] = (acc[type] || 0) + 1;
                          return acc;
                        }, {})).map(([type, count]) => (
                          <tr key={type}>
                            <td>{type}</td>
                            <td>{count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {details && (
                  <div className="card">
                    <h3>Length Details</h3>
                    <table>
                      <tbody>
                        {details.features
                          .filter(f => ['LineString', 'MultiLineString'].includes(f.geometry.type))
                          .map((feature, index) => {
                            const length = turf.length(feature);
                            return (
                              <tr key={index}>
                                <td>{feature.geometry.type}</td>
                                <td>{length.toFixed(2)} km</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="map-container">
                <MapContainer 
                  center={[0, 0]} 
                  zoom={2} 
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer 
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <GeoJSON 
                    data={geoJson} 
                    style={{ color: '#4a90e2', weight: 3 }}
                  />
                </MapContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;