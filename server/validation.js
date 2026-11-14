const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLead(input = {}) {
  const errors = {};
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const phone = typeof input.phone === 'string' ? input.phone.trim() : '';
  const service = typeof input.service === 'string' ? input.service.trim() : '';
  const message = typeof input.message === 'string' ? input.message.trim() : '';
  if (name.length < 2 || name.length > 80) errors.name = 'Enter a name between 2 and 80 characters.';
  if (!emailPattern.test(email) || email.length > 254) errors.email = 'Enter a valid email address.';
  if (phone.length > 30 || (phone && !/^[+\d().\s-]+$/.test(phone))) errors.phone = 'Enter a valid phone number.';
  if (!service || service.length > 100) errors.service = 'Choose a service you are interested in.';
  if (message.length < 8 || message.length > 2000) errors.message = 'Add a message between 8 and 2,000 characters.';
  return { valid: Object.keys(errors).length === 0, errors, value: { name, email, phone, service, message } };
}
