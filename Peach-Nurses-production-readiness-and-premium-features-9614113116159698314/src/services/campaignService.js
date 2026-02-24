export const campaignService = {
    checkCampaigns: (user, lastLogin) => {
        const campaigns = [];

        // Welcome Campaign
        // Logic: if account created < 1 day ago and !welcomeSeen
        // Simplified: just check if it's the first time we run this?
        // We'll use a flag in user profile or local storage in real app.
        // Here, we return a welcome message if user is new (based on mocked 'newly created' state).

        // Mock: 10% chance on login to see a follow-up
        if (Math.random() < 0.1) {
            campaigns.push({
                id: 'follow_up',
                type: 'modal',
                title: 'We Missed You! 🍑',
                content: 'It\'s been a while. Discover 5 new Peaches nearby!',
                action: 'Start Swiping'
            });
        }

        // KYC Nudge
        if (user.kycStatus !== 'verified' && Math.random() < 0.2) {
             campaigns.push({
                id: 'kyc_nudge',
                type: 'modal',
                title: 'Get Verified 🛡️',
                content: 'Verify your identity to unlock Business features and the "Verified" badge.',
                action: 'Verify Now'
            });
        }

        return campaigns;
    }
};
