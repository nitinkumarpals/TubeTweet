# TubeTweet API

TubeTweet is a platform that combines features of YouTube and Twitter, enabling users to upload videos, interact via comments (tweets), manage playlists, and subscribe to channels. This project is built using Bun, Express, MongoDB, and includes Docker and Docker Compose configurations for deployment.

## Features
- User Management
  - Register, login, and logout.
  - Update profile details such as avatar, cover image, and account information.
  - Change password and refresh authentication tokens.
  - View user history and channel profiles.

- Video Management
  - Upload, update, and delete videos.
  - Toggle publish status.
  - Get videos by ID or retrieve all videos.

- Comment Management (Tweets)
  - Add, update, and delete comments.
  - Get video comments and individual comment details.

- Subscription Management
  - Subscribe to channels.
  - Toggle subscription status.
  - View subscriber lists.

- Playlist Management
  - Create, update, and delete playlists.
  - Add or remove videos in playlists.
  - Retrieve playlists by ID or for the current user.

- Likes Management
  - Toggle likes for videos, comments, and tweets.
  - View videos liked by the current user.

- Dashboard
  - Get channel status.
  - Retrieve videos for a specific channel.

## Data Models

### User
- **ID**: Unique identifier for the user.
- **watchHistory**: Array of watched videos.
- **userName**: Username of the user.
- **email**: Email address.
- **fullName**: Full name.
- **avatar**: Profile picture.
- **coverImage**: Cover image.
- **password**: User password.
- **refreshToken**: Token used for session refresh.
- **createdAt**: Timestamp of creation.
- **updatedAt**: Timestamp of last update.

### Video
- **ID**: Unique identifier for the video.
- **videoFile**: File path for the video.
- **thumbnail**: Thumbnail image path.
- **owner**: Object ID of the user who owns the video.
- **title**: Video title.
- **description**: Video description.
- **duration**: Duration of the video.
- **views**: View count.
- **isPublished**: Publish status.
- **createdAt**: Timestamp of creation.
- **updatedAt**: Timestamp of last update.

### Tweet (Comment)
- **ID**: Unique identifier for the tweet.
- **owner**: Object ID of the user who created the tweet.
- **content**: Text content of the tweet.
- **createdAt**: Timestamp of creation.
- **updatedAt**: Timestamp of last update.

### Subscription
- **ID**: Unique identifier for the subscription.
- **subscriber**: Object ID of the subscribing user.
- **channel**: Object ID of the subscribed channel.
- **createdAt**: Timestamp of creation.
- **updatedAt**: Timestamp of last update.

### Like
- **ID**: Unique identifier for the like.
- **comment**: Object ID of the liked comment.
- **video**: Object ID of the liked video.
- **likedBy**: Object ID of the user who liked.
- **tweet**: Object ID of the liked tweet.
- **createdAt**: Timestamp of creation.
- **updatedAt**: Timestamp of last update.

### Playlist
- **ID**: Unique identifier for the playlist.
- **name**: Playlist name.
- **description**: Playlist description.
- **videos**: Array of video Object IDs.
- **owner**: Object ID of the user who owns the playlist.
- **createdAt**: Timestamp of creation.
- **updatedAt**: Timestamp of last update.

## API Endpoints

### User Endpoints
- **POST /users/register**: Register a new user.
- **POST /users/login**: Log in a user.
- **POST /users/logout**: Log out the current user.
- **POST /users/change-password**: Change the password of the logged-in user.
- **GET /users/current-user**: Retrieve the details of the logged-in user.
- **PATCH /users/update-avatar**: Update the user avatar.
- **PATCH /users/update-coverImage**: Update the user cover image.
- **PATCH /users/update-account**: Update user account details.
- **GET /users/channel/:userName**: Retrieve channel profile details.
- **GET /users/history**: Retrieve user activity history.
- **POST /users/refresh-token**: Refresh access and refresh tokens.

### Tweet Endpoints
- **POST /tweets/create**: Create a new tweet.
- **GET /tweets/:id**: Get a tweet by ID.
- **PATCH /tweets/:id**: Update a tweet.
- **DELETE /tweets/:id**: Delete a tweet.

### Subscription Endpoints
- **POST /subscriptions/toggle**: Toggle subscription status.
- **GET /subscriptions/:channelId/subscribers**: Retrieve subscriber list.

### Video Endpoints
- **POST /videos/upload**: Upload a video.
- **GET /videos/:id**: Get video details by ID.
- **PATCH /videos/:id**: Update video details.
- **DELETE /videos/:id**: Delete a video.
- **PATCH /videos/:id/toggle-publish**: Toggle publish status of a video.
- **GET /videos**: Retrieve all videos.

### Playlist Endpoints
- **POST /playlists/create**: Create a playlist.
- **PATCH /playlists/:id**: Update a playlist.
- **DELETE /playlists/:id**: Delete a playlist.
- **POST /playlists/:id/add-video**: Add a video to a playlist.
- **DELETE /playlists/:id/remove-video**: Remove a video from a playlist.
- **GET /playlists/:id**: Get a playlist by ID.
- **GET /playlists/user**: Get playlists of the logged-in user.

### Like Endpoints
- **POST /likes/toggle-video**: Toggle like on a video.
- **POST /likes/toggle-tweet**: Toggle like on a tweet.
- **POST /likes/toggle-comment**: Toggle like on a comment.
- **GET /likes/videos**: Get videos liked by the logged-in user.

### Dashboard Endpoints
- **GET /dashboard/status**: Get channel status.
- **GET /dashboard/videos**: Retrieve channel videos.

## Authentication
- **Access Token**: Short-lived token for authenticated requests.
- **Refresh Token**: Used to renew the access token.

## Setup Instructions
1. Clone the repository.
2. Install dependencies using Bun:
   ```bash
   bun install
   ```
3. Start the development server:
   ```bash
   bun run dev
   ```
4. Build the project:
   ```bash
   bun run build
   ```
5. Use Docker for containerization:
   ```bash
   docker-compose up
   ```

## Technologies Used
- **Bun**: JavaScript runtime.
- **Express**: Web framework.
- **MongoDB**: Database.
- **Docker**: Containerization.
- **Docker Compose**: Multi-container orchestration.

---

Feel free to reach out for any questions or contributions!
