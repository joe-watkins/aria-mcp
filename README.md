# aria-mcp

A Model Context Protocol (MCP) server providing comprehensive access to the W3C WAI-ARIA specification. Designed for accessibility professionals, developers, and AI agents to query ARIA roles, states, properties, and accessibility requirements.

## Quick Start

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "aria": {
      "command": "npx",
      "args": ["-y", "aria-mcp"]
    }
  }
}
```

That's it! No cloning, no building - just add the config and start querying ARIA.

## Features

- **Complete ARIA 1.3 Specification Data**: Roles, states, properties, and their relationships
- **Role Validation**: Check attribute validity for specific roles
- **Accessibility Guidance**: Name requirements, landmarks, live regions
- **Smart Suggestions**: Get role recommendations based on UI component descriptions
- **Works Locally & Remotely**: stdio transport for local use, Netlify Functions for remote deployment

## Available Tools

| Tool | Description |
|------|-------------|
| **Role Information** | |
| `get-role` | Get detailed information about a specific ARIA role |
| `list-roles` | List all ARIA roles, optionally filtered by category |
| `search-roles` | Search for roles by keyword in name or description |
| `get-role-hierarchy` | Get the inheritance hierarchy for a role |
| **States & Properties** | |
| `get-attribute` | Get details about an ARIA state or property |
| `list-states` | List all ARIA states with descriptions |
| `list-properties` | List all ARIA properties, optionally global only |
| `get-global-attributes` | List all global ARIA states and properties |
| **Validation** | |
| `validate-role-attributes` | Validate if attributes are allowed for a role |
| `get-required-attributes` | Get required attributes for a role |
| `get-prohibited-attributes` | Get prohibited attributes for a role |
| **Role Relationships** | |
| `get-required-context` | Get required parent context for a role |
| `get-required-owned` | Get required child elements for a role |
| **Accessible Name** | |
| `check-name-requirements` | Check accessible name requirements for a role |
| `get-roles-requiring-name` | List all roles that require an accessible name |
| **Specialized Queries** | |
| `list-landmarks` | List all ARIA landmark roles with usage guidance |
| `list-widget-roles` | List interactive widget roles |
| `list-live-regions` | List live region roles with politeness levels |
| **Guidance** | |
| `suggest-role` | Get role suggestions based on UI component description |
| `get-aria-version` | Get ARIA specification version and statistics |
| `get-server-info` | Get information about this MCP server |

## Installation

```bash
npm install
```

### Configure Claude Desktop

Add this to your Claude Desktop MCP settings (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "aria-mcp": {
      "command": "node",
      "args": ["/path/to/aria-mcp/src/index.js"]
    }
  }
}
```

### Configure Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "aria-mcp": {
      "command": "node",
      "args": ["/path/to/aria-mcp/src/index.js"]
    }
  }
}
```

## Usage Examples

### Query a Role

```
get-role button
```

Returns complete information about the button role including:
- Description and purpose
- Category (widget, landmark, etc.)
- Required/supported/prohibited attributes
- Name requirements
- Parent/child role requirements

### Validate Attributes

```
validate-role-attributes role=button attributes=["aria-pressed","aria-expanded","aria-label"]
```

Checks if each attribute is valid, required, or prohibited for the role.

### Get Role Suggestions

```
suggest-role "dropdown menu with autocomplete"
```

Returns suggested roles (combobox, listbox) with usage guidance.

### List Landmarks

```
list-landmarks
```

Lists all ARIA landmark roles with best practices for page structure.

## Data Source

This MCP server uses data parsed directly from the [W3C ARIA repository](https://github.com/w3c/aria), which is included as a Git submodule.

### Updating the Data

To update to the latest ARIA specification:

```bash
npm run update-submodule
```

This will:
1. Pull the latest changes from the W3C ARIA repository
2. Re-parse the specification to regenerate `data/aria-data.json`

### Manual Parsing

To regenerate the data without updating the submodule:

```bash
npm run parse
```

## Project Structure

```
aria-mcp/
├── src/
│   ├── index.js          # MCP server with stdio transport
│   └── tools.js          # Tool definitions and handlers
├── scripts/
│   └── parse-aria-spec.js # Parser for W3C ARIA HTML specs
├── data/
│   ├── aria/             # W3C ARIA repo (Git submodule)
│   └── aria-data.json    # Parsed specification data
├── netlify/
│   └── functions/
│       └── api.js        # Netlify Function for remote use
└── netlify.toml          # Netlify configuration
```

## Deployment to Netlify

This project is configured for Netlify deployment.

### Deploy via GitHub

1. Push this repository to GitHub
2. Connect to Netlify via the dashboard
3. Netlify will automatically build and deploy

### Using the Remote Server

Once deployed, configure your MCP client:

```json
{
  "mcpServers": {
    "aria-mcp": {
      "command": "npx",
      "args": ["mcp-remote@next", "https://your-site.netlify.app/mcp"]
    }
  }
}
```

## Use Cases

### For Accessibility Professionals

- **Quick Reference**: Look up role requirements without leaving your IDE
- **Validation**: Verify ARIA usage in code reviews
- **Training**: Help team members understand ARIA semantics

### For Developers

- **Real-time Guidance**: Get role suggestions while building components
- **Attribute Validation**: Catch invalid ARIA usage early
- **Documentation**: Access spec details without browser context switching

### For AI Agents

- **Code Generation**: Generate accessible components with correct ARIA
- **Code Review**: Validate ARIA usage in pull requests
- **Accessibility Audits**: Check for missing or incorrect attributes

## ARIA Specification Coverage

- **100 Roles**: All roles from WAI-ARIA 1.3
- **10 States**: Dynamic values that change with user interaction
- **43 Properties**: Static or rarely-changing characteristics
- **Role Categories**: widget, composite, document, landmark, liveRegion, window, abstract

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run parse` if modifying the parser
5. Submit a pull request

## License

MIT

## Resources

- [WAI-ARIA Specification](https://w3c.github.io/aria/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
