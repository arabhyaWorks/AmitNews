import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { NewsCard, NewsCardSkeleton } from '../components/news/NewsCard';
import { ChevronRight } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categoryImages = {
  sports: 'https://images.unsplash.com/photo-1730739463889-34c7279277a9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2ODh8MHwxfHNlYXJjaHwzfHxjcmlja2V0JTIwbWF0Y2glMjBpbmRpYSUyMHN0YWRpdW18ZW58MHx8fHwxNzczOTEzMTcyfDA&ixlib=rb-4.1.0&q=85',
  politics: 'https://images.unsplash.com/photo-1760872645826-ff7a32cd59bf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTZ8MHwxfHNlYXJjaHwzfHxpbmRpYW4lMjBwYXJsaWFtZW50JTIwYnVpbGRpbmd8ZW58MHx8fHwxNzczOTEzMTczfDA&ixlib=rb-4.1.0&q=85',
  entertainment: 'https://images.unsplash.com/photo-1614115866447-c9a299154650?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwxfHxib2xseXdvb2QlMjByZWQlMjBjYXJwZXQlMjBldmVudHxlbnwwfHx8fDE3NzM5MTMxODd8MA&ixlib=rb-4.1.0&q=85',
  business: 'https://images.unsplash.com/photo-1761818645943-a3689c34ca03?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBvZmZpY2UlMjBidXNpbmVzcyUyMG1lZXRpbmclMjBpbmRpYXxlbnwwfHx8fDE3NzM5MTMxODh8MA&ixlib=rb-4.1.0&q=85',
  technology: 'https://images.unsplash.com/photo-1680992044138-ce4864c2b962?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzZ8MHwxfHNlYXJjaHwzfHx0ZWNobm9sb2d5JTIwYWJzdHJhY3QlMjBzZXJ2ZXIlMjByb29tfGVufDB8fHx8MTc3MzkxMzE4OXww&ixlib=rb-4.1.0&q=85',
  crime: 'https://images.unsplash.com/photo-1758354973067-9c8811edcfd7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4MTJ8MHwxfHNlYXJjaHwyfHxjcmltZSUyMHNjZW5lJTIwaW52ZXN0aWdhdGlvbiUyMHRhcGV8ZW58MHx8fHwxNzczOTEzMTkwfDA&ixlib=rb-4.1.0&q=85'
};

export default function HomePage() {
  const { t, isHindi } = useLanguage();
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [latestArticles, setLatestArticles] = useState([]);
  const [categoryArticles, setCategoryArticles] = useState({});
  const [loading, setLoading] = useState(true);

  const categories = ['sports', 'crime', 'politics', 'entertainment', 'business', 'technology'];

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      
      // Fetch featured articles
      const featuredRes = await axios.get(`${API}/public/articles?featured=true&limit=4`);
      setFeaturedArticles(featuredRes.data);

      // Fetch latest articles
      const latestRes = await axios.get(`${API}/public/articles?limit=10`);
      setLatestArticles(latestRes.data);

      // Fetch articles by category
      const categoryPromises = categories.map(cat => 
        axios.get(`${API}/public/articles?category=${cat}&limit=4`)
      );
      const categoryResults = await Promise.all(categoryPromises);
      
      const catArticles = {};
      categories.forEach((cat, index) => {
        catArticles[cat] = categoryResults[index].data;
      });
      setCategoryArticles(catArticles);

    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6]" data-testid="home-page">
      {/* Featured Section - Bento Grid */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="section-divider mb-8">
          <h2 className={`text-3xl md:text-4xl font-bold text-[#2a5a5a] ${isHindi ? 'font-hindi-heading' : 'font-heading'}`}>
            {t('featured')}
          </h2>
        </div>

        {loading ? (
          <div className="bento-grid">
            <div className="bento-hero bg-gray-200 animate-pulse rounded" />
            <div className="bento-sub bg-gray-200 animate-pulse rounded" />
            <div className="bento-sub bg-gray-200 animate-pulse rounded" />
          </div>
        ) : featuredArticles.length > 0 ? (
          <div className="bento-grid">
            {featuredArticles[0] && (
              <NewsCard article={featuredArticles[0]} variant="hero" />
            )}
            {featuredArticles.slice(1, 3).map((article) => (
              <NewsCard key={article.article_id} article={article} variant="sub" />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <p className={isHindi ? 'font-hindi' : ''}>
              {isHindi ? 'अभी कोई फीचर्ड समाचार नहीं है' : 'No featured news yet'}
            </p>
          </div>
        )}
      </section>

      {/* Latest News Section */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="section-divider mb-8">
          <h2 className={`text-3xl md:text-4xl font-bold text-[#2a5a5a] ${isHindi ? 'font-hindi-heading' : 'font-heading'}`}>
            {t('latest')}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        ) : latestArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestArticles.slice(0, 6).map((article) => (
              <NewsCard key={article.article_id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <p className={isHindi ? 'font-hindi' : ''}>
              {isHindi ? 'अभी कोई समाचार नहीं है' : 'No news yet'}
            </p>
          </div>
        )}
      </section>

      {/* Category Sections */}
      {categories.map((category) => (
        <section key={category} className="max-w-7xl mx-auto px-4 py-8">
          <div className="section-divider mb-8 flex items-center justify-between">
            <h2 className={`text-2xl md:text-3xl font-bold text-[#2a5a5a] ${isHindi ? 'font-hindi-heading' : 'font-heading'}`}>
              {t(category)}
            </h2>
            <Link 
              to={`/category/${category}`}
              className="flex items-center gap-1 text-[#2a5a5a] hover:text-[#f4c430] font-semibold text-sm uppercase tracking-wider transition-colors"
              data-testid={`view-all-${category}`}
            >
              {isHindi ? 'सभी देखें' : 'View All'}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <NewsCardSkeleton key={i} />
              ))}
            </div>
          ) : (categoryArticles[category] || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(categoryArticles[category] || []).map((article) => (
                <NewsCard key={article.article_id} article={article} />
              ))}
            </div>
          ) : (
            <div className="relative h-48 rounded overflow-hidden group">
              <img 
                src={categoryImages[category]} 
                alt={t(category)}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <p className={`text-white text-lg ${isHindi ? 'font-hindi' : ''}`}>
                  {isHindi ? `${t(category)} में कोई समाचार नहीं` : `No ${t(category)} news yet`}
                </p>
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
