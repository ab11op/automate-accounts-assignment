function extractInfo(ocrText) {
    // Enhanced OCR correction with receipt-specific patterns
    const correctedText = ocrText
        .replace(/\bBeerbas\b/gi, 'BeerHaus')
        .replace(/\bEMV\b/gi, '') // Remove payment technical terms
        .replace(/\bTT\b/g, '') // Remove stray characters
        .replace(/\bB30\b/gi, 'BBQ') // Correct modifier
        .replace(/[©®™]/g, '') // Remove special characters
        .replace(/\s{2,}/g, ' ') // Compress multiple spaces
        .replace(/(\d)\s+(\d)/g, '$1$2'); // Fix digit separation

    const lines = correctedText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 1);

    const result = {
        merchant: '',
        address: '',
        location: '',
        date: '',
        time: '',
        transactionId: '',
        storeId: '',
        cashierId: '',
        items: [],
        discounts: [],
        subtotal: 0,
        taxes: [],
        total: 0,
        payment: {
            method: 'UNKNOWN',
            amount: 0,
            details: {}
        },
        phone: '',
        rawText: ocrText
    };

    // Helper functions
    const findAmount = (text) => {
        const amountMatch = text.match(/-?\d{1,3}(?:[,\s.]?\d{0,3})?[.,]\d{2}/);
        return amountMatch ? parseFloat(amountMatch[0].replace(/[,\s]/g, '')) : null;
    };

    const isItemStarter = (line) => {
        return /^\d+\s+[A-Za-z]/.test(line) || 
               (/^\d+\s*[xX]?\s*[A-Za-z]/.test(line) && findAmount(line));
    };

    // Extract metadata from header section
    let headerEndIndex = 0;
    for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i];
        
        // Merchant detection (first non-date meaningful line)
        if (!result.merchant && !/\d{1,2}\/\d{1,2}\/\d{4}/.test(line) && 
            !/\d{1,2}:\d{2}/.test(line) && /[A-Za-z]{3,}/.test(line)) {
            result.merchant = line;
        }
        
        // Date and time extraction
        if (!result.date) {
            const dateMatch = line.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
            if (dateMatch) result.date = dateMatch[0];
        }
        if (!result.time) {
            const timeMatch = line.match(/\d{1,2}:\d{2}/);
            if (timeMatch) result.time = timeMatch[0];
        }
        
        // Transaction details
        if (/check:/i.test(line)) {
            result.transactionId = line.match(/\d+/)?.[0] || '';
        }
        if (/server:/i.test(line)) {
            result.cashierId = line.split(':')[1]?.trim() || '';
        }
        if (/terminal:/i.test(line)) {
            result.storeId = line.match(/\d+/)?.[0] || '';
        }
        
        // Detect end of header (start of items)
        if (isItemStarter(line)) {
            headerEndIndex = i;
            break;
        }
    }

    // Dynamic item extraction with quantity awareness
    let currentItem = null;
    let lastHadPrice = false;
    
    for (let i = headerEndIndex; i < lines.length; i++) {
        const line = lines[i];
        const amount = findAmount(line);
        const hasPrice = amount !== null;
        const isStarter = isItemStarter(line);
        
        // Start of new item
        if (isStarter && hasPrice) {
            if (currentItem) result.items.push(currentItem);
            
            // Extract quantity and name
            const match = line.match(/^(\d+)\s+(.*)/);
            const qty = match ? parseInt(match[1]) : 1;
            const rest = match ? match[2] : line;
            
            // Remove price from name
            const name = rest.replace(new RegExp(amount + '$'), '').trim();
            
            currentItem = {
                name: name,
                price: amount,
                quantity: qty,
                modifiers: []
            };
            lastHadPrice = true;
        }
        // Continue item with modifier
        else if (currentItem && !hasPrice && !isStarter) {
            // Skip summary lines disguised as modifiers
            if (!/subtotal|tax|total|payment/i.test(line)) {
                currentItem.modifiers.push(line);
            }
            lastHadPrice = false;
        }
        // Item without price on starter line
        else if (isStarter && !hasPrice) {
            if (currentItem) result.items.push(currentItem);
            currentItem = {
                name: line.replace(/^\d+\s*/, ''),
                price: 0,
                quantity: parseInt(line.match(/^\d+/)?.[0] || 1),
                modifiers: []
            };
            lastHadPrice = false;
        }
        // Price-only line (modifier with price)
        else if (currentItem && hasPrice && !lastHadPrice) {
            currentItem.price = amount;
            lastHadPrice = true;
        }
        
        // Financial section detection
        if (/subtotal|net total|total items/i.test(line) && amount) {
            if (currentItem) {
                result.items.push(currentItem);
                currentItem = null;
            }
            result.subtotal = amount;
        }
        else if (/tax|vat/i.test(line) && amount) {
            result.taxes.push({
                amount: amount,
                description: line
            });
        }
        else if (/total|amount due/i.test(line) && amount) {
            result.total = amount;
        }
        else if (/(cash|card|credit|debit|mastercard|visa)/i.test(line)) {
            const method = line.match(/(cash|card|credit|debit|mastercard|visa)/i)?.[0] || 'UNKNOWN';
            result.payment.method = method.toUpperCase();
            if (amount) result.payment.amount = amount;
        }
        
        // Break conditions
        if (/(grand total|end of receipt|thank you)/i.test(line)) {
            break;
        }
    }
    
    // Push last item if exists
    if (currentItem) result.items.push(currentItem);

    // Post-processing
    // 1. Calculate missing financials
    if (!result.subtotal && result.items.length > 0) {
        result.subtotal = result.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
    
    if (!result.total && result.subtotal) {
        const totalTax = result.taxes.reduce((sum, tax) => sum + tax.amount, 0);
        result.total = result.subtotal + totalTax;
    }
    
    if (!result.payment.amount && result.total) {
        result.payment.amount = result.total;
    }
    
    // 2. Clean up item names
    result.items.forEach(item => {
        item.name = item.name.replace(/[^a-zA-Z0-9\s]/g, '');
    });

    return result;
}

export default extractInfo