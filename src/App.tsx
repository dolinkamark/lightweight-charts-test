import { CandlestickChart } from './components/CandlestickChart';
import { ChartComponent } from './components/ChartComponent';
import stockData from './data/NVDA_5min_20250812.json';

const initialData = [
  { time: '2018-12-22', value: 32.51 },
  { time: '2018-12-23', value: 31.11 },
  { time: '2018-12-24', value: 27.02 },
  { time: '2018-12-25', value: 27.32 },
  { time: '2018-12-26', value: 25.17 },
  { time: '2018-12-27', value: 28.89 },
  { time: '2018-12-28', value: 25.46 },
  { time: '2018-12-29', value: 23.92 },
  { time: '2018-12-30', value: 22.68 },
  { time: '2018-12-31', value: 22.67 },
];

const candlesticks = stockData.values.map(s => {
  const time = Math.floor(
    new Date(s.datetime.replace(' ', 'T') + 'Z').getTime() / 1000
  );

  return {
    time: time,
    open: parseFloat(s.open),
    high: parseFloat(s.high),
    low: parseFloat(s.low),
    close: parseFloat(s.close),
  };
});

function App() {
  return (
    <>
      <div style={{ margin: '20px' }}>
        <ChartComponent data={initialData} />
      </div>
      <div style={{ margin: '20px' }}>
        <CandlestickChart data={candlesticks} />
      </div>
    </>
  );
}

export default App;
