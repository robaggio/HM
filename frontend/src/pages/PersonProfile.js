import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';

const PersonProfile = () => {
    const { personId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [person, setPerson] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check if we have navigation history
    const hasHistory = location.key !== 'default';

    const handleNavigation = () => {
        if (hasHistory) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    useEffect(() => {
        const fetchPersonDetails = async () => {
            try {
                const response = await fetch(`/api/private/people/${personId}`);
                if (response.ok) {
                    const data = await response.json();
                    setPerson(data);
                } else {
                    console.error('Failed to fetch person details');
                }
            } catch (err) {
                console.error('Error fetching person details:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPersonDetails();
    }, [personId]);

    if (isLoading) {
        return (
            <div className="profile-page">
                <div className="loading">
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    if (!person) {
        return (
            <div className="profile-page">
                <div className="error">Person not found</div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-header" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '20px 0'
            }}>
                <button
                    className="back-button"
                    onClick={handleNavigation}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#666'
                    }}
                >
                    <span className="material-icons">
                        {hasHistory ? 'arrow_back' : 'home'}
                    </span>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ margin: 0 }}>{person.name}</h2>
                    {person.nickname && (
                        <span style={{ color: '#666' }}>({person.nickname})</span>
                    )}
                </div>
            </div>
            <div className="profile-content">
                <div className="profile-section">
                    <div className="profile-dates">
                        <div>Created: {new Date(person.created_at).toLocaleDateString()}</div>
                        {person.updated_at && (
                            <div>Last updated: {new Date(person.updated_at).toLocaleDateString()}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonProfile; 