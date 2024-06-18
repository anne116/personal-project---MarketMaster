import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function Analysis() {
    const location = useLocation();
    const { keyword } = location.state || {};

    const [ stats, setStats ] = useState(null);
    const [ suggestedTitle, setSuggestedTitle ] = useState(null);
    const [ error, setError ] = useState(null);

    useEffect( () => {
        if (keyword) {
            fetchStatistics();
            fetchSuggestedTitle();
        }
    }, [keyword]);

    const fetchStatistics = async() => {
        try {
            const response = await fetch (`http://localhost:8000/fetch_statistics?keyword=${encodeURIComponent(keyword)}`)
            if (!response.ok) throw new Error('Failed to fetch statistics')
            const data = await response.json();
            setStats(data);
        } catch(err) {
            setError(err.message)
        }
    };

    const fetchSuggestedTitle = async() => {
        try {
            const titleResponse = await fetch(`http://localhost:8000/suggested_title?keyword=${encodeURIComponent(keyword)}`)
            if (!titleResponse.ok) throw new Error('Failed to fetch suggested title')
            const suggested_title = await titleResponse.json();
            setSuggestedTitle(suggested_title)
        } catch(err) {
            setError(err.message)
        }
    }

    return (
        <div>
            <h1>Product Analysis for "{keyword}"</h1>
            {error && <p>{error}</p>}

            {stats ? (
                <div>
                    <div style={{ marginBottom: '20px'}}>
                    <h2>Statistics</h2>
                    <p>Estimated Seller Count: {stats.seller_count}</p>
                    <p>Price Range: ${stats.price_range[0]} - ${stats.price_range[1]}</p>
                    <p>Average Price: ${stats.average_price.toFixed(2)}</p>
                    <p>Average Rating: {stats.average_rating.toFixed(2)}</p>
                    <p>Average Review: {stats.average_reviews.toFixed(0)}</p>
                    </div>
                    <div>
                        <h2>Other Analysis/Suggestions</h2>
                    </div>
                </div>
            ): (
                <p>Loading...</p>
            )}

            {suggestedTitle && (
                <div>
                    <h3>Suggested Title</h3>
                    <p>{ suggestedTitle }</p>
                </div>
            )}

        </div>
    );
}
export default Analysis;


