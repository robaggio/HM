import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';

const PersonProfile = () => {
    const { personId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [person, setPerson] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState(null);

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
                    setFormData(data);
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/private/people/${personId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const updatedPerson = await response.json();
                setPerson(updatedPerson);
                setIsEditMode(false);
            } else {
                console.error('Failed to update person');
            }
        } catch (err) {
            console.error('Error updating person:', err);
        }
    };

    const handleCancel = () => {
        setFormData(person);
        setIsEditMode(false);
    };

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
                gap: '10px',
                padding: '10px 0'
            }}>
                <button
                    className="icon-button"
                    onClick={handleNavigation}
                >
                    <span className="material-icons">
                        {hasHistory ? 'arrow_back' : 'home'}
                    </span>
                </button>
                {!isEditMode ? (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                            <h2 style={{ margin: 0 }}>{person.name}</h2>
                            {person.nickname && (
                                <span style={{ color: '#666' }}>({person.nickname})</span>
                            )}
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => setIsEditMode(true)}
                        >
                            Edit
                        </button>
                    </>
                ) : (
                    <h2 style={{ margin: 0 }}>Edit Person</h2>
                )}
            </div>
            <div className="profile-content">
                {!isEditMode ? (
                    <div className="profile-section">
                        <div className="section-container">
                            <h3 className="section-title">Basic</h3>
                            <div className="section-content">
                                {person.gender && (
                                    <div className="info-item">
                                        <strong>Gender: </strong> 
                                        {person.gender === 'male' ? 'Male' : person.gender === 'female' ? 'Female' : person.gender}
                                    </div>
                                )}
                                {person.birthday && (
                                    <div className="info-item">
                                        <strong>Birthday: </strong> {person.birthday}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="section-container">
                            <h3 className="section-title">Resources & Needs</h3>
                            <div className="section-content">
                                {person.resources && (
                                    <div className="info-item">
                                        <strong>Resources: </strong> {person.resources}
                                    </div>
                                )}
                                {person.needs && (
                                    <div className="info-item">
                                        <strong>Needs: </strong> {person.needs}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="section-container">
                            <h3 className="section-title">Contact</h3>
                            <div className="section-content">
                                {person.phone && (
                                    <div className="info-item">
                                        <strong>Phone: </strong> {person.phone}
                                    </div>
                                )}
                                {person.email && (
                                    <div className="info-item">
                                        <strong>Email: </strong> {person.email}
                                    </div>
                                )}
                                {person.city && (
                                    <div className="info-item">
                                        <strong>City: </strong> {person.city}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="section-container">
                            <h3 className="section-title">Maintain</h3>
                            <div className="section-content maintain-info">
                                <div className="info-item">
                                    <strong>Created: </strong> {new Date(person.created_at).toLocaleString()}
                                </div>
                                {person.updated_at && (
                                    <div className="info-item">
                                        <strong>Last Updated: </strong> {new Date(person.updated_at).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '10px', maxWidth: '500px' }}>
                        <div className="form-section">
                            <h3 className="section-title">Basic</h3>
                            <div style={{ display: 'grid', gap: '5px' }}>
                                <label>
                                    Name:
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        style={{
                                            width: '70%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd'
                                        }}
                                    />
                                </label>
                                <label>
                                    Nickname:
                                    <input
                                        type="text"
                                        name="nickname"
                                        value={formData.nickname || ''}
                                        onChange={handleInputChange}
                                        style={{
                                            width: '70%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd'
                                        }}
                                    />
                                </label>
                                <label>
                                    Gender:
                                    <select
                                        name="gender"
                                        value={formData.gender || ''}
                                        onChange={handleInputChange}
                                        style={{
                                            width: '50%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd'
                                        }}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </label>
                                <label>
                                    Birthday:
                                    <input
                                        type="date"
                                        name="birthday"
                                        value={formData.birthday || ''}
                                        onChange={handleInputChange}
                                        style={{
                                            width: '70%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd'
                                        }}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="section-title">Resources & Needs</h3>
                            <div style={{ display: 'grid', gap: '5px' }}>
                                <label>
                                    Resources:
                                    <textarea
                                        name="resources"
                                        value={formData.resources || ''}
                                        onChange={handleInputChange}
                                        placeholder="What can this person provide?"
                                        style={{
                                            width: '90%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd',
                                            minHeight: '40px'
                                        }}
                                    />
                                </label>
                                <label>
                                    Needs:
                                    <textarea
                                        name="needs"
                                        value={formData.needs || ''}
                                        onChange={handleInputChange}
                                        placeholder="What does this person need?"
                                        style={{
                                            width: '90%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd',
                                            minHeight: '40px'
                                        }}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="section-title">Contact</h3>
                            <div style={{ display: 'grid', gap: '5px' }}>
                                <label>
                                    Phone:
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone || ''}
                                        onChange={handleInputChange}
                                        style={{
                                            width: '70%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd'
                                        }}
                                    />
                                </label>
                                <label>
                                    Email:
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email || ''}
                                        onChange={handleInputChange}
                                        style={{
                                            width: '70%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd'
                                        }}
                                    />
                                </label>
                                <label>
                                    City:
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city || ''}
                                        onChange={handleInputChange}
                                        style={{
                                            width: '70%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd'
                                        }}
                                    />
                                </label>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                            >
                                Save
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default PersonProfile; 