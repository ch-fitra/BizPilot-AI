/**
 * Input validation and prompt guards to defend against injections/over-sized inputs
 */

export interface ValidateChatInput {
  message: string;
  business_id?: string | null;
  analysis_id?: string | null;
  role?: 'user' | 'assistant';
}

export function validateAndSanitizeInput(input: any): ValidateChatInput {
  if (!input) {
    throw new Error('Request body is empty.');
  }

  let { message, business_id, analysis_id, role } = input;

  // 1. Validate "message" field
  if (message === undefined || message === null) {
    throw new Error('Message is required (message wajib diisi).');
  }

  if (typeof message !== 'string') {
    throw new Error('Message must be of type string.');
  }

  const trimmedMessage = message.trim();
  if (trimmedMessage.length === 0) {
    throw new Error('Message content cannot be blank.');
  }

  if (trimmedMessage.length > 2000) {
    throw new Error('Message is too long. Maximum allowed is 2000 characters.');
  }

  // 2. Validate "role" if supplied
  if (role) {
    if (role !== 'user' && role !== 'assistant') {
      throw new Error('Role must be either "user" or "assistant".');
    }
  } else {
    role = 'user';
  }

  // 3. Validate UUID forms for business_id and analysis_id if they look like strings
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  
  if (business_id) {
    if (typeof business_id !== 'string') {
      throw new Error('business_id must be a string.');
    }
    if (business_id.includes('-') && !uuidRegex.test(business_id)) {
      throw new Error('Invalid business_id UUID format.');
    }
  }

  if (analysis_id) {
    if (typeof analysis_id !== 'string') {
      throw new Error('analysis_id must be a string.');
    }
    if (analysis_id.includes('-') && !uuidRegex.test(analysis_id)) {
      throw new Error('Invalid analysis_id UUID format.');
    }
  }

  // 4. Sanitize text: strip suspicious HTML elements to block direct XSS attempts
  const sanitizedMessage = trimmedMessage
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, ' ') // convert tags to spaces
    .replace(/\s+/g, ' ') // collapse multi-spaces
    .trim();

  return {
    message: sanitizedMessage,
    business_id: business_id || null,
    analysis_id: analysis_id || null,
    role
  };
}

/**
 * Clean data model strings used in AI context builder to avoid structured format failures
 */
export function sanitizeContextText(text: string | undefined | null): string {
  if (!text) return 'Tidak tersedia / Not available';
  return text
    .replace(/[*_`#]/g, '') // strip markdown accents
    .trim();
}
