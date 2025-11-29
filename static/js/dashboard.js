class TradingDashboard {
    constructor() {
        this.lastUpdateTime = null;
        this.isUpdating = false;
        this.currentTimeframe = '5m';
        this.chart = null;
        this.candlestickSeries = null;
        this.chartManuallyAdjusted = false;
        this.savedTimeRange = null;
        
        this.initChart();
        this.bindEvents();
        this.startDataUpdates();
        
        this.updateDashboard();
        this.updateChart();
    }

    initChart() {
        const container = document.getElementById('chart-container');
        if (!container) return;
        
        this.chart = LightweightCharts.createChart(container, {
            layout: {
                textColor: '#d1d5db',
                background: { color: '#000000' }
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
            grid: {
                vertLines: { color: 'rgba(59, 130, 246, 0.1)' },
                horzLines: { color: 'rgba(59, 130, 246, 0.1)' }
            }
        });
        
        this.candlestickSeries = this.chart.addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ff3366',
            borderUpColor: '#16a34a',
            borderDownColor: '#ff0044',
            wickUpColor: '#22c55e',
            wickDownColor: '#ff3366'
        });
        
        this.chart.timeScale().fitContent();
        
        this.chart.timeScale().subscribeVisibleTimeRangeChange((timeRange) => {
            if (timeRange) {
                this.savedTimeRange = timeRange;
                this.chartManuallyAdjusted = true;
            }
        });
    }

    bindEvents() {
        document.getElementById('start-bot').addEventListener('click', () => {
            this.startBot();
        });

        document.getElementById('stop-bot').addEventListener('click', () => {
            this.stopBot();
        });

        document.getElementById('close-position').addEventListener('click', () => {
            this.closePosition();
        });

        document.getElementById('delete-trade').addEventListener('click', () => {
            this.deleteLastTrade();
        });

        document.getElementById('reset-balance').addEventListener('click', () => {
            this.resetBalance();
        });

        // Timeframe buttons
        document.querySelectorAll('.tf-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTimeframe = e.target.getAttribute('data-tf');
                this.chartManuallyAdjusted = false;
                this.savedTimeRange = null;
                this.updateChart();
            });
        });
    }

    async updateChart() {
        try {
            const response = await fetch(`/api/chart_data?timeframe=${this.currentTimeframe}`);
            if (!response.ok) return;
            
            const data = await response.json();
            
            if (!this.candlestickSeries || !data.candles || data.candles.length === 0) return;
            
            // Convert time strings to timestamps
            const candles = data.candles.map((candle, idx) => ({
                time: Math.floor(Date.now() / 1000) - (data.candles.length - idx) * 60,
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close
            }));
            
            this.candlestickSeries.setData(candles);
            
            // Add SAR points as markers with offset
            if (data.sar_points && data.sar_points.length > 0) {
                const markers = data.sar_points.map((point, idx) => ({
                    time: candles[idx].time,
                    position: point.trend === 'up' ? 'belowBar' : 'aboveBar',
                    color: point.color,
                    shape: 'circle',
                    size: 'large'
                }));
                this.candlestickSeries.setMarkers(markers);
            }
            
            if (!this.chartManuallyAdjusted) {
                this.chart.timeScale().fitContent();
            }
        } catch (error) {
            console.error('Chart update error:', error);
        }
    }

    async startBot() {
        try {
            const response = await fetch('/api/start_bot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                this.showNotification('success', data.message || 'Bot started successfully');
            } else {
                this.showNotification('error', data.error || 'Failed to start bot');
            }
        } catch (error) {
            this.showNotification('error', 'Server connection error');
            console.error('Start bot error:', error);
        }
    }

    async stopBot() {
        try {
            const response = await fetch('/api/stop_bot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                this.showNotification('success', data.message || 'Bot stopped successfully');
            } else {
                this.showNotification('error', data.error || 'Failed to stop bot');
            }
        } catch (error) {
            this.showNotification('error', 'Server connection error');
            console.error('Stop bot error:', error);
        }
    }

    async closePosition() {
        try {
            const response = await fetch('/api/close_position', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                this.showNotification('success', data.message || 'Position closed successfully');
            } else {
                this.showNotification('error', data.error || 'Failed to close position');
            }
        } catch (error) {
            this.showNotification('error', 'Server connection error');
            console.error('Close position error:', error);
        }
    }

    async deleteLastTrade() {
        try {
            const response = await fetch('/api/delete_last_trade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                this.showNotification('success', data.message || 'Last trade deleted successfully');
                this.updateDashboard();
            } else {
                this.showNotification('error', data.error || 'Failed to delete last trade');
            }
        } catch (error) {
            this.showNotification('error', 'Server connection error');
            console.error('Delete trade error:', error);
        }
    }

    async resetBalance() {
        try {
            const response = await fetch('/api/reset_balance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                this.showNotification('success', data.message || 'Balance reset successfully');
                this.updateDashboard();
            } else {
                this.showNotification('error', data.error || 'Failed to reset balance');
            }
        } catch (error) {
            this.showNotification('error', 'Server connection error');
            console.error('Reset balance error:', error);
        }
    }

    async updateDashboard() {
        if (this.isUpdating) {
            return;
        }

        this.isUpdating = true;

        try {
            const response = await fetch('/api/status');
            if (!response.ok) {
                console.error('Status fetch failed');
                return;
            }

            const data = await response.json();

            const statusBadge = document.getElementById('bot-status');
            if (data.bot_running) {
                statusBadge.textContent = 'RUNNING';
                statusBadge.className = 'badge bg-success';
            } else {
                statusBadge.textContent = 'STOPPED';
                statusBadge.className = 'badge bg-danger';
            }

            document.getElementById('balance').textContent = `$${parseFloat(data.balance).toFixed(2)}`;
            document.getElementById('available').textContent = `$${parseFloat(data.available).toFixed(2)}`;

            if (data.current_price) {
                document.getElementById('current-price').textContent = `$${parseFloat(data.current_price).toFixed(2)}`;
            }

            if (data.sar_directions) {
                this.updateSARDirections(data.sar_directions);
            }

            if (data.in_position && data.position) {
                document.getElementById('position-status').textContent = data.position.side.toUpperCase();
                this.updatePosition(data.position, data.current_price);
            } else {
                document.getElementById('position-status').textContent = 'No Position';
                this.clearPosition();
            }

            if (data.trades) {
                this.updateTrades(data.trades);
            }

            this.lastUpdateTime = new Date();
        } catch (error) {
            console.error('Dashboard update error:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    updateSARDirections(directions) {
        const timeframes = ['1m', '5m', '15m'];
        let allMatch = true;
        let matchDirection = null;
        
        timeframes.forEach(tf => {
            const element = document.getElementById(`sar-${tf}`);
            const container = document.getElementById(`sar-${tf}-container`);
            const direction = directions[tf];
            
            if (element && container) {
                element.className = 'badge sar-badge';
                container.classList.remove('text-danger', 'text-success', 'text-warning');
                
                if (direction === 'long') {
                    element.textContent = 'LONG';
                    element.classList.add('bg-success');
                    container.classList.add('text-success');
                    if (matchDirection === null) {
                        matchDirection = 'long';
                    } else if (matchDirection !== 'long') {
                        allMatch = false;
                    }
                } else if (direction === 'short') {
                    element.textContent = 'SHORT';
                    element.classList.add('bg-danger');
                    container.classList.add('text-danger');
                    container.classList.add('text-danger');
                    if (matchDirection === null) {
                        matchDirection = 'short';
                    } else if (matchDirection !== 'short') {
                        allMatch = false;
                    }
                } else {
                    element.textContent = 'N/A';
                    element.classList.add('bg-secondary');
                    container.classList.remove('text-success', 'text-danger');
                    allMatch = false;
                }
            }
        });
        
        const signalElement = document.getElementById('signal-status');
        if (signalElement) {
            if (allMatch && matchDirection) {
                if (matchDirection === 'long') {
                    signalElement.textContent = 'LONG SIGNAL';
                    signalElement.className = 'badge bg-success signal-badge';
                } else {
                    signalElement.textContent = 'SHORT SIGNAL';
                    signalElement.className = 'badge bg-danger signal-badge';
                }
            } else {
                signalElement.textContent = 'NO SIGNAL';
                signalElement.className = 'badge bg-secondary signal-badge';
            }
        }
    }

    updatePosition(position, currentPrice) {
        const noPosition = document.getElementById('no-position');
        const currentPosition = document.getElementById('current-position');
        
        if (noPosition) noPosition.classList.add('d-none');
        if (currentPosition) currentPosition.classList.remove('d-none');
        
        const sideBadge = document.getElementById('pos-side');
        if (sideBadge) {
            sideBadge.textContent = position.side.toUpperCase();
            sideBadge.className = position.side === 'long' ? 'badge bg-success' : 'badge bg-danger';
        }
        
        const colorClass = position.side === 'long' ? 'text-success' : 'text-danger';
        
        const entryElement = document.getElementById('pos-entry');
        if (entryElement) {
            entryElement.textContent = `$${parseFloat(position.entry_price).toFixed(2)}`;
            entryElement.className = colorClass;
        }
        
        const sizeElement = document.getElementById('pos-size');
        if (sizeElement) {
            sizeElement.textContent = `${parseFloat(position.size_base).toFixed(6)} ETH`;
            sizeElement.className = colorClass;
        }
        
        const notionalElement = document.getElementById('pos-notional');
        if (notionalElement) {
            notionalElement.textContent = `$${parseFloat(position.notional).toFixed(2)}`;
            notionalElement.className = colorClass;
        }
        
        const timeElement = document.getElementById('pos-time');
        if (timeElement && position.entry_time) {
            const entryTime = new Date(position.entry_time);
            timeElement.textContent = entryTime.toLocaleTimeString();
            timeElement.className = colorClass;
        }
        
        const pnlElement = document.getElementById('pos-pnl');
        if (pnlElement && currentPrice) {
            const entryPrice = parseFloat(position.entry_price);
            const size = parseFloat(position.size_base);
            let pnl;
            
            if (position.side === 'long') {
                pnl = (currentPrice - entryPrice) * size;
            } else {
                pnl = (entryPrice - currentPrice) * size;
            }
            
            const pnlSign = pnl >= 0 ? '+' : '';
            pnlElement.textContent = `${pnlSign}$${pnl.toFixed(2)}`;
            pnlElement.className = pnl >= 0 ? 'text-success' : 'text-danger';
        }
    }

    clearPosition() {
        const noPosition = document.getElementById('no-position');
        const currentPosition = document.getElementById('current-position');
        
        if (noPosition) noPosition.classList.remove('d-none');
        if (currentPosition) currentPosition.classList.add('d-none');
    }

    updateTrades(trades) {
        const container = document.getElementById('trades-container');
        if (!container) return;
        
        if (!trades || trades.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-clock fa-2x mb-3"></i>
                    <p>No completed trades</p>
                </div>
            `;
            return;
        }
        
        const reversedTrades = [...trades].reverse();
        
        container.innerHTML = reversedTrades.map(trade => {
            const pnl = parseFloat(trade.pnl);
            const pnlClass = pnl >= 0 ? 'trade-profit' : 'trade-loss';
            const pnlSign = pnl >= 0 ? '+' : '';
            const sideClass = trade.side === 'long' ? 'bg-success' : 'bg-danger';
            
            return `
                <div class="trade-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="badge ${sideClass} me-2">${trade.side.toUpperCase()}</span>
                            <small class="text-muted">${trade.duration || 'N/A'}</small>
                        </div>
                        <div class="${pnlClass}">
                            ${pnlSign}$${pnl.toFixed(2)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    showNotification(type, message) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    updateTopGainers() {
        fetch('/api/top_gainers')
            .then(res => res.json())
            .then(data => {
                const container = document.getElementById('top-gainers-list');
                if (!data.gainers || data.gainers.length === 0) {
                    container.innerHTML = '<div class="text-center text-muted">No data</div>';
                    return;
                }
                
                const html = data.gainers.slice(0, 20).map((coin, idx) => {
                    const changeClass = coin.change >= 0 ? 'text-success' : 'text-danger';
                    const changeSign = coin.change >= 0 ? '+' : '';
                    return `
                        <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
                            <div>
                                <span class="badge bg-primary me-2">${idx + 1}</span>
                                <strong>${coin.symbol}</strong>
                            </div>
                            <div class="text-end">
                                <div class="text-light">$${coin.price ? coin.price.toFixed(6) : 'N/A'}</div>
                                <div class="${changeClass}"><strong>${changeSign}${coin.change.toFixed(2)}%</strong></div>
                            </div>
                        </div>
                    `;
                }).join('');
                container.innerHTML = html;
            })
            .catch(err => {
                console.log('Top gainers error:', err);
                document.getElementById('top-gainers-list').innerHTML = '<div class="text-danger p-3">Error loading data</div>';
            });
    }

    startDataUpdates() {
        setInterval(() => this.updateDashboard(), 3000);
        setInterval(() => this.updateChart(), 5000);
        setInterval(() => this.updateTopGainers(), 60000);
        this.updateTopGainers();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TradingDashboard();
});
