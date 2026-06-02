import hashlib
import re
from dataclasses import dataclass

TOKEN_RE = re.compile(r"\s*([A-Z0-9_]+|[()+/\-])\s*")


@dataclass(frozen=True)
class Node:
    kind: str
    value: str | None = None
    left: "Node | None" = None
    right: "Node | None" = None


def tokenize(expr: str):
    tokens = []
    i = 0
    while i < len(expr):
        m = TOKEN_RE.match(expr, i)
        if not m:
            raise ValueError(f"Invalid token near: {expr[i:]}")
        tokens.append(m.group(1))
        i = m.end()
    return tokens


class Parser:
    def __init__(self, expr: str):
        self.tokens = tokenize(expr) if expr else []
        self.pos = 0

    def peek(self):
        return self.tokens[self.pos] if self.pos < len(self.tokens) else None

    def eat(self, tok=None):
        cur = self.peek()
        if cur is None:
            raise ValueError("Unexpected end")
        if tok and cur != tok:
            raise ValueError(f"Expected {tok}, got {cur}")
        self.pos += 1
        return cur

    def parse(self):
        if not self.tokens:
            return Node("TRUE")
        node = self.parse_or()
        if self.peek() is not None:
            raise ValueError("Unexpected trailing tokens")
        return node

    def parse_or(self):
        left = self.parse_and()
        while self.peek() == "/":
            self.eat("/")
            right = self.parse_and()
            left = Node("OR", left=left, right=right)
        return left

    def parse_and(self):
        left = self.parse_not()
        while self.peek() not in {None, "/", ")"}:
            if self.peek() == "+":
                self.eat("+")
            right = self.parse_not()
            left = Node("AND", left=left, right=right)
        return left

    def parse_not(self):
        if self.peek() == "-":
            self.eat("-")
            return Node("NOT", left=self.parse_not())
        if self.peek() == "(":
            self.eat("(")
            node = self.parse_or()
            self.eat(")")
            return node
        token = self.peek()
        if token is None or token in {"+", "/", ")"}:
            raise ValueError("Expected code")
        self.eat()
        return Node("CODE", value=token)


def parse_expr(expr: str | None) -> Node:
    return Parser(expr or "").parse()


def eval_expr(node: Node, selected: set[str]) -> bool:
    if node.kind == "TRUE":
        return True
    if node.kind == "CODE":
        return (node.value or "") in selected
    if node.kind == "NOT":
        return not eval_expr(node.left, selected)
    if node.kind == "AND":
        return eval_expr(node.left, selected) and eval_expr(node.right, selected)
    if node.kind == "OR":
        return eval_expr(node.left, selected) or eval_expr(node.right, selected)
    raise ValueError("Unknown node")


def _flatten(kind: str, node: Node):
    if node.kind != kind:
        return [node]
    return _flatten(kind, node.left) + _flatten(kind, node.right)


def canonical_expr(node: Node) -> str:
    if node.kind == "TRUE":
        return "TRUE"
    if node.kind == "CODE":
        return f"CODE({node.value})"
    if node.kind == "NOT":
        return f"NOT({canonical_expr(node.left)})"
    if node.kind in {"AND", "OR"}:
        parts = sorted(canonical_expr(x) for x in _flatten(node.kind, node))
        return f"{node.kind}({', '.join(parts)})"
    raise ValueError("Unknown node")


def variant_key(condition_expr: str | None) -> str:
    c = canonical_expr(parse_expr(condition_expr))
    return hashlib.sha256(c.encode("utf-8")).hexdigest()
