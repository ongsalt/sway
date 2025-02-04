export function parse() {
    let index = 0

    function current(): Token {
        return tokens[index]
    }

    function previous(): Token {
        return tokens[index - 1]
    }

    function isAtEnd() {
        return current().type == "EOF";
    }


    function advance() {
        if (!isAtEnd()) {
            index += 1
        }
        return previous()
    }

    function check(tokenTypes: TokenType): boolean {
        if (isAtEnd()) {
            return false
        }
        return current().type == tokenTypes;
    }

    function match(...tokenTypes: TokenType[]) {
        for (const tokenType of tokenTypes) {
            if (check(tokenType)) {
                advance();
                return true;
            }
        }
        return false
    }

    function consume(tokenType: TokenType, message: string) {
        if (check(tokenType)) {
            return advance()
        }

        throw error(current(), message);
    }

}