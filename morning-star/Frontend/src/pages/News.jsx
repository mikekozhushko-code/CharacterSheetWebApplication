import React from 'react';
import '../styles/News.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext'; // ✅ Імпорт хука

const News = () => {
    const { t, language } = useLanguage(); // ✅ Дістаємо переклад та мову

    // ✅ Оновлені дані новин з використанням ключів перекладу
    const newsData = [
        {
            id: 1,
            title: t('news1_title'),
            date: "Jan 02, 2026",
            category: t('catPatch'),
            image: "/assets/images/news_necromancer.jpg",
            excerpt: t('news1_excerpt')
        },
        {
            id: 2,
            title: t('news2_title'),
            date: "Dec 28, 2025",
            category: t('catEvent'),
            image: "/assets/images/news_tavern.jpg",
            excerpt: t('news2_excerpt')
        },
        {
            id: 3,
            title: t('news3_title'),
            date: "Dec 15, 2025",
            category: t('catLore'),
            image: "/assets/images/news_lore.jpg",
            excerpt: t('news3_excerpt')
        },
        {
            id: 4,
            title: t('news4_title'),
            date: "Dec 10, 2025",
            category: t('catSystem'),
            image: "/assets/images/news_system.jpg",
            excerpt: t('news4_excerpt')
        }
    ];

    const featuredNews = newsData[0];
    const otherNews = newsData.slice(1);

    return (
        // ✅ Додаємо клас lang-uk для правильних шрифтів
        <div className={`news-page-wrapper ${language === 'uk' ? 'lang-uk' : ''}`}>
            <Header />
            
            <div className="news-container">
                <div className="news-header-section">
                    <h1 className="page-title">{t('newsTitle')}</h1>
                    <p className="page-subtitle">{t('newsSubtitle')}</p>
                </div>

                {/* FEATURED NEWS */}
                <div className="featured-news-card">
                    <div className="featured-image-box">
                        <div className="img-placeholder" style={{backgroundImage: `url(${featuredNews.image})`}}></div> 
                    </div>
                    <div className="featured-content">
                        <div className="news-meta">
                            <span className="news-tag">{featuredNews.category}</span>
                            <span className="news-date">{featuredNews.date}</span>
                        </div>
                        <h2 className="featured-title">{featuredNews.title}</h2>
                        <p className="featured-excerpt">{featuredNews.excerpt}</p>
                        <button className="read-more-btn">{t('readFull')}</button>
                    </div>
                </div>

                {/* NEWS GRID */}
                <div className="news-grid">
                    {otherNews.map(item => (
                        <div key={item.id} className="news-card">
                            <div className="card-image-box">
                                <div className="img-placeholder" style={{backgroundImage: `url(${item.image})`}}></div>
                            </div>
                            <div className="card-content">
                                <div className="news-meta">
                                    <span className="news-tag">{item.category}</span>
                                    <span className="news-date">{item.date}</span>
                                </div>
                                <h3 className="card-title">{item.title}</h3>
                                <p className="card-excerpt">{item.excerpt}</p>
                                <a href="#" className="card-link">{t('readMore')} →</a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default News;