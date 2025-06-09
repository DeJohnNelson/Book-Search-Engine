import User from '../models/User.js';
import { signToken } from '../services/auth.js';
import { AuthenticationError } from 'apollo-server-errors';

interface BookInput {
  bookId: string;
  authors?: string[];
  description?: string;
  title?: string;
  image?: string;
  link?: string;
}

interface UserType {
  _id: string;
  username: string;
  email: string;
  password?: string;
  savedBooks?: BookInput[];
  isCorrectPassword(password: string): Promise<boolean>;
}

interface AuthPayload {
  token: string;
  user: UserType;
}

interface ContextType {
  user?: {
    _id: string;
    username: string;
    email: string;
  };
}

const resolvers = {
  Query: {
    me: async (
      _parent: unknown,
      _args: unknown,
      context: ContextType
    ): Promise<UserType | null> => {
      if (!context.user) {
        throw new AuthenticationError('Not logged in');
      }
      return await User.findById(context.user._id);
    }
  },

  Mutation: {
    login: async (
      _parent: unknown,
      { email, password }: { email: string; password: string }
    ): Promise<AuthPayload> => {
      const user = await User.findOne({ email }) as UserType;
      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      const isValid = await user.isCorrectPassword(password);
      if (!isValid) {
        throw new AuthenticationError('Invalid credentials');
      }

      const token = signToken(user.username, user.email, user._id);
      return { token, user };
    },

    addUser: async (
      _parent: unknown,
      { username, email, password }: { username: string; email: string; password: string }
    ): Promise<AuthPayload> => {
      const user = await User.create({ username, email, password }) as UserType;
      const token = signToken(user.username, user.email, user._id);
      return { token, user };
    },

    saveBook: async (
      _parent: unknown,
      { book }: { book: BookInput },
      context: ContextType
    ): Promise<UserType | null> => {
      if (!context.user) {
        throw new AuthenticationError('Not logged in');
      }

      const updatedUser = await User.findByIdAndUpdate(
        context.user._id,
        { $addToSet: { savedBooks: book } },
        { new: true }
      );
      return updatedUser;
    },

    removeBook: async (
      _parent: unknown,
      { bookId }: { bookId: string },
      context: ContextType
    ): Promise<UserType | null> => {
      if (!context.user) {
        throw new AuthenticationError('Not logged in');
      }

      const updatedUser = await User.findByIdAndUpdate(
        context.user._id,
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      );
      return updatedUser;
    }
  }
};

export default resolvers;