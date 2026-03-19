import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { format } from 'date-fns';
import { Eye, Clock, User, ChevronLeft, Share2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { NewsCard } from '../components/news/NewsCard';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ArticlePage() {
  const { articleId } = useParams();
  const { t, isHindi } = useLanguage();
  
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/articles/${articleId}`);
      setArticle(response.data);
      
      // Fetch related articles from same category
      const relatedRes = await axios.get(`${API}/public/articles`, {
        params: { category: response.data.category, limit: 4 }
      });
      setRelatedArticles(relatedRes.data.filter(a => a.article_id !== articleId));
    } catch (error) {
      console.error('Error fetching article:', error);
      toast.error(isHindi ? 'लेख लोड करने में त्रुटि' : 'Error loading article');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'MMMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = isHindi && article.title_hi ? article.title_hi : article.title;
    
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(isHindi ? 'लिंक कॉपी हो गया!' : 'Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#2a5a5a] rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-[#f4c430] rounded-full" />
          </div>
          <p className="text-gray-600">{isHindi ? 'लोड हो रहा है...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="text-center">
          <h2 className={`text-2xl font-bold text-gray-900 mb-4 ${isHindi ? 'font-hindi-heading' : 'font-heading'}`}>
            {isHindi ? 'लेख नहीं मिला' : 'Article not found'}
          </h2>
          <Link to="/">
            <Button className="bg-[#2a5a5a] hover:bg-[#1f4444] text-white">
              {isHindi ? 'होम पर जाएं' : 'Go to Home'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const title = isHindi && article.title_hi ? article.title_hi : article.title;
  const content = isHindi && article.content_hi ? article.content_hi : article.content;
  const categoryName = t(article.category.toLowerCase());

  return (
    <div className="min-h-screen bg-[#faf9f6]" data-testid="article-page">
      {/* Hero Image */}
      {article.image_url && (
        <div className="relative h-[40vh] md:h-[60vh] overflow-hidden">
          <img 
            src={article.image_url} 
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Back Button */}
          <div className="absolute top-4 left-4">
            <Link to="/">
              <Button variant="ghost" className="bg-white/90 hover:bg-white text-gray-900" data-testid="back-to-home">
                <ChevronLeft className="w-5 h-5 mr-1" />
                {isHindi ? 'वापस' : 'Back'}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Category & Featured Badge */}
        <div className="flex items-center gap-3 mb-4">
          <Link 
            to={`/category/${article.category}`}
            className={`category-pill hover:bg-[#f4c430] hover:text-[#2a5a5a] ${isHindi ? 'font-hindi' : ''}`}
          >
            {categoryName}
          </Link>
          {article.is_featured && (
            <span className="featured-badge">
              {t('featured')}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className={`text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-6 ${isHindi ? 'font-hindi-heading' : 'font-heading'}`}>
          {title}
        </h1>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 text-gray-600 pb-6 border-b border-gray-200 mb-8">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className={isHindi ? 'font-hindi' : ''}>{t('by')} {article.author_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{formatDate(article.created_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>{article.views} {t('views')}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleShare}
            className="ml-auto text-[#2a5a5a] hover:text-[#f4c430]"
            data-testid="share-btn"
          >
            <Share2 className="w-4 h-4 mr-2" />
            {isHindi ? 'शेयर करें' : 'Share'}
          </Button>
        </div>

        {/* Article Body */}
        <div 
          className={`article-content ${isHindi ? 'font-hindi' : ''}`}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12 border-t border-gray-200">
          <h2 className={`text-2xl md:text-3xl font-bold text-[#2a5a5a] mb-8 ${isHindi ? 'font-hindi-heading' : 'font-heading'}`}>
            {isHindi ? 'संबंधित समाचार' : 'Related News'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.slice(0, 3).map((article) => (
              <NewsCard key={article.article_id} article={article} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
