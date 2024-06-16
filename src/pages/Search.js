import React, { useState } from 'react';

function Search() {
  const [keyword, setKeyword] = useState('');
  const [products, setProducts] = useState([]);
  // const [suggestedTitle, setSuggestedTitle] = useState(null);
  const [translatedText, setTranslatedText] = useState(null);
  const [displayLanguage, setDisplayLanguage] = useState('en'); 
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    setError(null);
    setTranslatedText(null);
    setProducts([]);
    try {

      // const titleResponse = await fetch(`http://localhost:8000/suggest-title?keyword=${keyword}`);
      // if (!titleResponse.ok) throw new Error('Failed to fetch title');
      // const titleData = await titleResponse.json();
      // setSuggestedTitle(titleData.suggestedTitle);

      const translateResponse = await fetch(`http://localhost:8000/translate?text=${encodeURIComponent(keyword)}&dest=${displayLanguage}`);
      if (!translateResponse.ok) throw new Error('Failed to fetch translation');
      const translateData = await translateResponse.json();
      const englishKeyword = translateData.translated_text;
      setTranslatedText(englishKeyword);

      const productResponse = await fetch(`http://localhost:8000/fetch_products?keyword=${encodeURIComponent(englishKeyword)}`);
      if (!productResponse.ok) throw new Error('Failed to fetch products');
      const products = await productResponse.json();
      console.log('Fetched products:', products);
      setProducts(products);
      // const trendResponse = await fetch(`http://localhost:8000/google-trends?keyword=${keyword}`);
      // if (!trendResponse.ok) throw new Error('Failed to fetch trends');
      // const trendData = await trendResponse.json();
      // setTrends(trendData.trend);
      // setRelatedKeywords(trendData.relatedKeywords);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Enter product keyword" />
      
      <select value={displayLanguage} onChange={(e) => setDisplayLanguage(e.target.value)}>
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
        <option value="zh-CN">Chinese</option>
        <option value="ja">Japanese</option>
      </select>
      
      <button onClick={handleSearch}>Search</button>

      {translatedText && (
        <div>
          <h3>Translated Text</h3>
          <p>{translatedText}</p>
        </div>
      )}

      {products.length > 0 && (
        <div>
          <h3>Search Results: </h3>
          {products.map((product) => (
            <div key={product.product_title}>
              <img src={product.main_Image} alt='product' />
              <p>Title: {product.product_title}</p>
              <p>Price: {product.price}</p>
              <p>Rating: {product.rating}</p>
              <p>Reviews: {product.reviews}</p>
            </div>
          ))}
        </div>
      )}
{/* 
      {suggestedTitle && (
        <div>
          <h3>Suggested Title</h3>
          <p>{suggestedTitle}</p>
        </div>
      )}

       */}
      {/*
      {trends && (
        <div>
          <h3>Search Trends</h3>
          <p>Historical Trends: {trends.join(', ')}</p>
          <p>Related Keywords: {relatedKeywords.join(', ')}</p>
        </div>
      )}
      */}
      {error && <p>{error}</p>}
    </div>
  );
}

export default Search;
