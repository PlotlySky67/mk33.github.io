import { FirebaseError } from 'firebase/app';

const MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'That email doesn’t look right.',
  'auth/user-not-found': 'No account with that email.',
  'auth/wrong-password': 'Wrong password.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/email-already-in-use': 'An account already exists with that email.',
  'auth/weak-password': 'Password needs at least 6 characters.',
  'auth/network-request-failed': 'Network error — check your connection.',
};

export function friendlyAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    return MESSAGES[error.code] ?? 'Something went wrong. Try again.';
  }
  return 'Something went wrong. Try again.';
}
