export interface User {
  userId: string
  screenName: string
  createdAt: string
}

export interface Image {
  rowId: number
  imageId: string
  size: string
  width: number
  height: number
  createdAt: string
  url: string
}

export interface Target {
  userId: string
  name: string
  threadId: string
  createdAt: string
}

export interface Tweet {
  tweetId: string
  user: User
  tags: string[]
  text: string
  images: Image
  target: Target
}

export interface Item {
  rowId: number;
  createdAt: string;
  tweet: Tweet;
  images: Image[];
  target?: Target
}
