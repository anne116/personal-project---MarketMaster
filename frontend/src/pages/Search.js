import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Search() {
   const [ keyword, setKeyword ] = useState('');
   const [ products, setProducts ] = useState([]);
   const [ searchKeyword, setSearchKeyword ] = useState('');
   const [ translatedText, setTranslatedText ] = useState(null);
   const [ displayLanguage, setDisplayLanguage ] = useState('en'); 
   const [ error, setError ] = useState(null);
   const [ fetching, setFetching ] = useState(false);

   const navigate = useNavigate();

   const fetchProducts = async (keyword) => {
    try {
      setFetching(true);
      const fetchResponse = await fetch(`http://localhost:8000/fetch_products?keyword=${encodeURIComponent(keyword)}`)
      const products = await fetchResponse.json();
      setProducts(products);
      setFetching(false);
    } catch (err) {
      setError(err.message);
      setFetching(false);
    }
   }

   const handleSearch = async () => {
     setError(null);
     setTranslatedText(null);
     setSearchKeyword(keyword);
     setProducts([]);
     setFetching(true);

     try {
        const translateResponse = await fetch(`http://localhost:8000/translate?text=${encodeURIComponent(keyword)}&dest=${displayLanguage}`);
        if (!translateResponse.ok) throw new Error('Failed to fetch translation');
        const translateData = await translateResponse.json();
        const englishKeyword = translateData.translated_text;
        setTranslatedText(englishKeyword);

        await fetchProducts(englishKeyword);

        const productResponse = await fetch(`http://localhost:8000/fetch_products?keyword=${encodeURIComponent(englishKeyword)}`);
        if (!productResponse.ok) throw new Error('Failed to fetch products');
        const products = await productResponse.json();
        setProducts(products);

     } catch (err) {
       setError(err.message);
     }
   };

   const handleAnalysisClick = () => {
    navigate('/analysis', { state: { keyword: searchKeyword } });
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

        { translatedText && (
            <div>
            <h3>Translated Text</h3>
            <p>{translatedText}</p>
            </div>
       )}

        { fetching && <p>Fetching data.Please wait...</p>}

        { products.length > 0 && (
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

        { searchKeyword && <button onClick={ handleAnalysisClick }>More Analytic Insights</button>}

       {error && <p>{error}</p>}
     </div>
   );
}

export default Search;