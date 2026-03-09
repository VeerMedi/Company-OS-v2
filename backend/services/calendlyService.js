const axios = require('axios');

class CalendlyService {
    constructor() {
        this.apiKey = process.env.CALENDLY_API_KEY;
        this.baseURL = 'https://api.calendly.com';
        this.organizationUri = process.env.CALENDLY_ORGANIZATION_URI;
        this.userUri = process.env.CALENDLY_USER_URI;
    }

    // Get Calendly API client
    getClient() {
        if (!this.apiKey) {
            throw new Error('Calendly API key not configured. Please add CALENDLY_API_KEY to .env file');
        }

        return axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    // Get current user info
    async getCurrentUser() {
        try {
            const client = this.getClient();
            const response = await client.get('/users/me');
            return response.data.resource;
        } catch (error) {
            console.error('Calendly getCurrentUser error:', error.response?.data || error.message);
            throw error;
        }
    }

    // Get all scheduled events
    async getScheduledEvents(options = {}) {
        try {
            const client = this.getClient();
            const params = {
                organization: options.organization || this.organizationUri || undefined,
                user: options.user || this.userUri || undefined,
                status: options.status || 'active',
                min_start_time: options.minStartTime || undefined,
                max_start_time: options.maxStartTime || undefined,
                count: options.count || 100
            };

            const response = await client.get('/scheduled_events', { params });
            return response.data.collection;
        } catch (error) {
            console.error('Calendly getScheduledEvents error:', error.response?.data || error.message);
            throw error;
        }
    }

    // Get event details
    async getEventDetails(eventUri) {
        try {
            const client = this.getClient();
            const response = await client.get(eventUri);
            return response.data.resource;
        } catch (error) {
            console.error('Calendly getEventDetails error:', error.response?.data || error.message);
            throw error;
        }
    }

    // Get event invitees
    async getEventInvitees(eventUri) {
        try {
            const client = this.getClient();
            const response = await client.get(`${eventUri}/invitees`);
            return response.data.collection;
        } catch (error) {
            console.error('Calendly getEventInvitees error:', error.response?.data || error.message);
            throw error;
        }
    }

    // Cancel event
    async cancelEvent(eventUri, reason = '') {
        try {
            const client = this.getClient();
            const response = await client.post(`${eventUri}/cancellation`, {
                reason: reason
            });
            return response.data;
        } catch (error) {
            console.error('Calendly cancelEvent error:', error.response?.data || error.message);
            throw error;
        }
    }

    // Create webhook subscription
    async createWebhook(webhookUrl, events) {
        try {
            const client = this.getClient();
            const response = await client.post('/webhook_subscriptions', {
                url: webhookUrl,
                organization: this.organizationUri,
                events: events || ['invitee.created', 'invitee.canceled'],
                scope: 'organization'
            });
            return response.data.resource;
        } catch (error) {
            console.error('Calendly createWebhook error:', error.response?.data || error.message);
            throw error;
        }
    }

    // List all webhooks
    async listWebhooks() {
        try {
            const client = this.getClient();
            const params = {
                organization: this.organizationUri,
                scope: 'organization'
            };
            const response = await client.get('/webhook_subscriptions', { params });
            return response.data.collection;
        } catch (error) {
            console.error('Calendly listWebhooks error:', error.response?.data || error.message);
            throw error;
        }
    }

    // Delete webhook
    async deleteWebhook(webhookUri) {
        try {
            const client = this.getClient();
            await client.delete(webhookUri);
            return { success: true };
        } catch (error) {
            console.error('Calendly deleteWebhook error:', error.response?.data || error.message);
            throw error;
        }
    }

    // Get event types (available meeting types)
    async getEventTypes(options = {}) {
        try {
            const client = this.getClient();
            const params = {
                organization: this.organizationUri || undefined,
                user: this.userUri || undefined,
                count: options.count || 20
            };
            const response = await client.get('/event_types', { params });
            return response.data.collection;
        } catch (error) {
            console.error('Calendly getEventTypes error:', error.response?.data || error.message);
            throw error;
        }
    }

    // Check if API is configured
    isConfigured() {
        // Only require API key - organization/user URI are optional
        return !!this.apiKey;
    }
}

module.exports = new CalendlyService();
