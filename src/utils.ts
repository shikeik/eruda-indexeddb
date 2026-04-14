function processClass(str: string): string {
    const prefix = 'eruda-';
    return str
        .trim()
        .split(/\s+/)
        .map((singleClass) => {
            if (singleClass.includes(prefix)) {
                return singleClass;
            }
            return singleClass.replace(/[\w-]+/, (match) => `${prefix}${match}`);
        })
        .join(' ');
}

export function classPrefix(str: string): string {
    // Replace class="..." inside HTML tags
    return str.replace(/\bclass=(['"`])(.*?)\1/g, (_match, quote, classes) => {
        return `class=${quote}${processClass(classes)}${quote}`;
    });
}
