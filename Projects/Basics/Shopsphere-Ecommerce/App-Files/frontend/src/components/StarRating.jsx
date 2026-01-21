import React from 'react';

const StarRating = ({ rating }) => {
  return (
    <div className="flex mt-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      ))}
      <span className="text-sm text-gray-600 ml-1">({rating?.toFixed(1)})</span>
    </div>
  );
};

export default StarRating;