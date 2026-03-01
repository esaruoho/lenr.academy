import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LimitSelector from './LimitSelector';

describe('LimitSelector', () => {
  it('displays "All" when value is null', () => {
    render(<LimitSelector value={null} onChange={vi.fn()} />);
    expect(screen.getByTestId('limit-selector-button')).toHaveTextContent('All');
  });

  it('displays "All" when value is undefined', () => {
    render(<LimitSelector value={undefined} onChange={vi.fn()} />);
    expect(screen.getByTestId('limit-selector-button')).toHaveTextContent('All');
  });

  it('displays the value for known options', () => {
    render(<LimitSelector value={100} onChange={vi.fn()} />);
    expect(screen.getByTestId('limit-selector-button')).toHaveTextContent('100');
  });

  it('displays the value as string for custom numbers', () => {
    render(<LimitSelector value={250} onChange={vi.fn()} />);
    expect(screen.getByTestId('limit-selector-button')).toHaveTextContent('250');
  });

  it('opens dropdown on button click', () => {
    render(<LimitSelector value={100} onChange={vi.fn()} />);
    fireEvent.click(screen.getByTestId('limit-selector-button'));
    expect(screen.getByTestId('limit-option-100')).toBeInTheDocument();
    expect(screen.getByTestId('limit-option-500')).toBeInTheDocument();
    expect(screen.getByTestId('limit-option-1000')).toBeInTheDocument();
  });

  it('calls onChange with selected value', () => {
    const onChange = vi.fn();
    render(<LimitSelector value={100} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('limit-selector-button'));
    fireEvent.click(screen.getByTestId('limit-option-500'));
    expect(onChange).toHaveBeenCalledWith(500);
  });

  it('calls onChange with undefined for Unlimited', () => {
    const onChange = vi.fn();
    render(<LimitSelector value={100} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('limit-selector-button'));
    // The "Unlimited" option has value null which maps to undefined
    fireEvent.click(screen.getByText(/Unlimited/));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('shows custom input when Custom is selected', () => {
    render(<LimitSelector value={100} onChange={vi.fn()} />);
    fireEvent.click(screen.getByTestId('limit-selector-button'));
    fireEvent.click(screen.getByText('Custom'));
    expect(screen.getByPlaceholderText('Enter custom limit')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('submits custom value on OK click', () => {
    const onChange = vi.fn();
    render(<LimitSelector value={100} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('limit-selector-button'));
    fireEvent.click(screen.getByText('Custom'));

    const input = screen.getByPlaceholderText('Enter custom limit');
    fireEvent.change(input, { target: { value: '250' } });
    fireEvent.click(screen.getByText('OK'));

    expect(onChange).toHaveBeenCalledWith(250);
  });

  it('submits 0 as undefined', () => {
    const onChange = vi.fn();
    render(<LimitSelector value={100} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('limit-selector-button'));
    fireEvent.click(screen.getByText('Custom'));

    const input = screen.getByPlaceholderText('Enter custom limit');
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.click(screen.getByText('OK'));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('cancels custom input', () => {
    render(<LimitSelector value={100} onChange={vi.fn()} />);
    fireEvent.click(screen.getByTestId('limit-selector-button'));
    fireEvent.click(screen.getByText('Custom'));
    fireEvent.click(screen.getByText('Cancel'));

    // Should be back to normal button
    expect(screen.getByTestId('limit-selector-button')).toBeInTheDocument();
  });

  it('shows recommended hint text', () => {
    render(<LimitSelector value={100} onChange={vi.fn()} />);
    expect(screen.getByText(/Recommended/)).toBeInTheDocument();
  });
});
