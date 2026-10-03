import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Introduce a Task label', () => {
  render(<App />);
  const labelElement = screen.getByText(/introduce a task/i);
  expect(labelElement).toBeInTheDocument();
});
