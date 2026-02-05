const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const logger = require('../../core/logger');

class EarthquakeService {
    constructor(client) {
        this.client = client;
        this.apiUrl = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/E-A0015-001';
        this.apiKey = process.env.CWA_API_KEY;
        this.lastReportTime = null; // Track the time of the last processed report
        this.interval = null;
    }

    init() {
        if (!this.apiKey) {
            logger.warn('CWA_API_KEY is missing. Earthquake alerts will not work.');
            return;
        }

        // Poll every 1 minute
        this.interval = setInterval(() => this.checkEarthquake(), 60 * 1000);
        logger.info('EarthquakeService started (Polling CWA API).');
    }

    async checkEarthquake() {
        try {
            const response = await axios.get(this.apiUrl, {
                params: {
                    Authorization: this.apiKey,
                    format: 'JSON',
                    limit: 1,
                    sort: 'time'
                }
            });

            const records = response.data.records.Earthquake;
            if (!records || records.length === 0) return;

            const report = records[0];
            const reportTime = new Date(report.EarthquakeInfo.OriginTime).getTime();

            // First run: just set the time, don't spam old alerts
            if (!this.lastReportTime) {
                this.lastReportTime = reportTime;
                return;
            }

            // New report found
            if (reportTime > this.lastReportTime) {
                this.lastReportTime = reportTime;
                await this.sendAlert(report);
            }

        } catch (error) {
            // Ignore API errors mostly to avoid log spam, but log critical failures
            if (error.response) {
                logger.error(`CWA API Error: ${error.response.status} - ${error.response.statusText}`);
            }
        }
    }

    async sendAlert(report) {
        const info = report.EarthquakeInfo;
        const magnitude = info.EarthquakeMagnitude.MagnitudeValue;
        const depth = info.FocalDepth;
        const location = info.Epicenter.Location;
        const time = info.OriginTime;
        const url = report.Web; // CWA Web Link
        const imageUrl = report.ReportImageURI; // Map Image

        // Prepare Embed
        const embed = new EmbedBuilder()
            .setTitle('🔴 地震速報 (Earthquake Alert)')
            .setDescription(`**時間**: ${time}\n**位置**: ${location}\n**規模 (M)**: ${magnitude}\n**深度**: ${depth} km`)
            .setImage(imageUrl)
            .setColor(magnitude >= 5 ? '#FF0000' : '#FFA500') // Red for major, Orange for minor
            .setURL(url)
            .setFooter({ text: '資料來源: 中央氣象署 (CWA)' })
            .setTimestamp();

        // Get Subscribers
        const subs = db.prepare('SELECT * FROM earthquake_subs').all();

        for (const sub of subs) {
            try {
                // Determine Local Intensity for this Guild (Not easily mapped from API per-user location, 
                // but we can list major intensity areas)
                // For simplicity, we send to all subscribers. 
                // Ideally, we could filter by magnitude threshold.

                // Check magnitude/intensity filter if implemented
                // if (info.EarthquakeMagnitude.MagnitudeValue < sub.min_scale) continue;

                const channel = await this.client.channels.fetch(sub.channel_id);
                if (channel) {
                    await channel.send({ content: sub.min_intensity > 3 ? '@here' : null, embeds: [embed] });
                }
            } catch (err) {
                logger.error(`Failed to send earthquake alert to channel ${sub.channel_id}: ${err.message}`);
            }
        }
    }
}

module.exports = EarthquakeService;
