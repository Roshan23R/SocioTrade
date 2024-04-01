const likesWeight=1;
const commentsWeight=2;
const sharesWeight=3;
const viewsWeight=4;
const followersWeight=5;

// export const calculatePoints=(likes,shares,comments,views,followers)=>{
//     let pointsEarn = 
// }



let previousEngagementRate = 0;

function calculateEngagementRate(likes, views, followers) {
    return ((likes + views) / followers) * 100;
}

function getRandomValue(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateEngagement() {
    // Generate random likes, views, and followers
    const newLikes = getRandomValue(50, 200);
    const newViews = getRandomValue(500, 1000);
    const newFollowers = getRandomValue(1000, 1500);

    const newEngagementRate = calculateEngagementRate(newLikes, newViews, newFollowers);

    console.log(`New Engagement Rate: ${newEngagementRate.toFixed(2)}% per minute`);

    // Check if it's the first iteration or if the rate has changed
    if (previousEngagementRate !== 0 && newEngagementRate !== previousEngagementRate) {
        // Compare with the previous engagement rate
        if (newEngagementRate > previousEngagementRate) {
            console.log("Engagement rate increased!");
        } else {
            console.log("Engagement rate decreased!");
        }
    }

    // Update the previous engagement rate for the next iteration
    previousEngagementRate = newEngagementRate;
}

// Call the update function every minute (adjust the interval as needed)
setInterval(updateEngagement, 60 * 1000);