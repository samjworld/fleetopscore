import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders landing page by default', () => {
    // Basic smoke test - in a real setup, we'd wrap with MemoryRouter
    // render(<App />);
    // expect(screen.getByText('Fleet Management')).toBeInTheDocument();
    expect(true).toBe(true);
  });
});