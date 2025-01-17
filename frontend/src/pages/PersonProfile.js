import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';

const PersonProfile = () => {
    const { personId } = useParams();
    const navigate = useNavigate();
    const [person, setPerson] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

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
            <div className="profile-header">
                <button
                    className="back-button"
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                    }}
                >
                    <span className="material-icons">arrow_back</span>
                    Back
                </button>
            </div>
            <div className="profile-content">
                <div className="profile-section">
                    <h2>{person.name}</h2>
                    {person.nickname && (
                        <div className="profile-nickname">
                            Nickname: {person.nickname}
                        </div>
                    )}
                </div>
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