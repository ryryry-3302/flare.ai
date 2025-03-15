import React from 'react';
import PropTypes from 'prop-types';
import './StyleAvatar.css'; // Assuming you have a CSS file for styling

const StyleAvatar = ({ styleType, avatarUrl }) => {
    return (
        <div className="style-avatar">
            <img src={avatarUrl} alt={`${styleType} avatar`} className="avatar-image" />
            <div className="style-description">
                <h3>{styleType}</h3>
                <p>Here’s a brief description of the writing style represented by this avatar.</p>
            </div>
        </div>
    );
};

StyleAvatar.propTypes = {
    styleType: PropTypes.string.isRequired,
    avatarUrl: PropTypes.string.isRequired,
};

export default StyleAvatar;