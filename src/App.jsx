import React, { useState} from 'react';
import {QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import './App.css';

// React Queryのクライアントを作成
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5分
            cacheTime: 1000 * 60 * 10, // 10分
            refetchOnWindowFocus: false, // ウィンドウがフォーカスされたときに再取得しない
            retry: 1, // 1回だけ再試行
            refetchOnReconnect: false, // 再接続時に再取得しない
            refetchOnMount: false, // マウント時に再取得しない
            refetchInterval: false, // 定期的に再取得しない
      },
    },
  });

const formatDate = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayDateString = () => {
  // JSTで現在の日付を取得
  const today = new Date(new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));
  return formatDate(today);
};

const apiKey = process.env.REACT_APP_NASA_API_KEY || 'DEMO_KEY';

//追加：データ取得をコンポーネントから分離
const fetchApodData = async (date) => {
    let apiUrl = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;
    if (date) {
        apiUrl += `&date=${date}`;
  }
  if (!apiKey || (apiKey === 'DEMO_KEY' && !process.env.REACT_APP_NASA_API_KEY)) {
        console.warn("NASA API Key is missing or using DEMO_KEY. Please set REACT_APP_NASA_API_KEY in your .env file. Rate limits are applied with DEMO_KEY.");
  }
  const response = await fetch(apiUrl);
  if (!response.ok) {
   let errorMsg = `HTTP error! Status: ${response.status}`;
           try {
              const errorData = await response.json();
              errorMsg = errorData?.msg || errorMsg;
                      } catch (e) {
                            console.error("Failed to parse error response:", e);
              }
                          throw new Error(errorMsg);
            }
            return response.json();
          };

function NasaApod({ date }) {
  const { data:apodData,isLoading,isError,error,isFetching} = useQuery({
      queryKey: ['apod', date],
      queryFn: () => fetchApodData(date),
      staleTime: Infinity, // データは常に新鮮
      enable: !!date, // dateが存在する場合のみクエリを有効にする
});
  if (isLoading) {
        return <div style={{ textAlign: 'center', padding: '40px' }}>天文写真を読み込み中...</div>;
  }
  if (isError) {
      return <p className="error-message" style={{ color: 'red', fontWeight: 'bold', textAlign: 'center', padding: '20px' }}>{error.message}</p>;
  }
  if (!apodData) {
      return <p style={{ textAlign: 'center', padding: '40px' }}>データが見つかりません。</p>;
  }
  return (
      <div className="apod-container">
          {isFetching && <p style={{ textAlign: 'center', padding: '20px' }}>データを更新中...</p>}
          <h2>{apodData.title}</h2>
          <p className="apod-date">{apodData.date}</p>
          {apodData.media_type === 'image' ? (
                    <img
                      src={apodData.url}
                      alt={apodData.title}
                      className="apod-image"
                      loading="lazy" // 画像の遅延読み込み
                    />
    )        : apodData.media_type === 'video' ? (
              <div className="apod-video-info">
                    <p>この日のAPODは動画です。以下のリンクからご覧ください:</p>
                  <a href={apodData.url} target="_blank" rel="noopener noreferrer">{apodData.url}</a>
      </div>
    )        : (
              <p>サポートされていないメディアタイプです: {apodData.media_type}</p>
    )}
          <p className="apod-explanation">{apodData.explanation}</p>
    </div>
      );
}

function App() {
  const todayString = getTodayDateString();
  const [currentDate, setCurrentDate] = useState(todayString);

  const handlePreviousDay = () => {
    const dateParts = currentDate.split('-').map(Number);
    // 月は0始まりなので-1
    const currentObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    currentObj.setDate(currentObj.getDate() - 1);
    setCurrentDate(formatDate(currentObj));
  };

  const handleNextDay = () => {
    const dateParts = currentDate.split('-').map(Number);
    const currentObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    currentObj.setDate(currentObj.getDate() + 1);

    // 未来の日付には移動しない
    if (formatDate(currentObj) <= todayString) {
      setCurrentDate(formatDate(currentObj));
    }
  };

  const isNextDisabled = currentDate >= todayString;

  return (
      <QueryClientProvider client={queryClient}>
          <div className="app">
      <h1 style={{ textAlign: 'center', padding: '40px' }}>今日の天文写真</h1>

      <div className="navigation">
        <button onClick={handlePreviousDay} className="nav-button prev-button">
          ← 前の日 (previous)
        </button>
        <span className="current-date">{currentDate}</span>
        <button
          onClick={handleNextDay}
          className="nav-button next-button"
          disabled={isNextDisabled}
          >
          → 次の日 (next)
          </button>
        </div>

        <NasaApod date={currentDate} />
        </div>
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      </QueryClientProvider>
  );
}
export default App;