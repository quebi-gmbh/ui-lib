import {createRoot} from 'react-dom/client';
import {
  Button,
  Dialog,
  DialogTrigger,
  Label,
  ListBox,
  ListBoxItem,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
  Select,
  SelectValue,
} from 'react-aria-components';

// The page is 3000px tall against an 800px viewport, and the triggers sit at y=1500.
// The harness scrolls to a known offset before opening anything, so a trigger is a
// controlled distance down the viewport with room above it. `placement="top"` is then
// emitted as a `bottom:` value, which is the branch under test -- no flip is needed,
// because `top` is already the bottom-anchored placement.
//
// Nothing here has a positioned ancestor: every overlay is portalled to `document.body`,
// so its containing block is whatever the harness positions -- `<html>` or `<body>`.
function App() {
  return (
    <div style={{height: 3000, paddingTop: 1500, paddingLeft: 40, boxSizing: 'border-box'}}>
      <div style={{display: 'flex', gap: 24}}>
        <DialogTrigger>
          <Button id="popover-trigger">popover</Button>
          <Popover placement="top" offset={8}>
            <Dialog aria-label="probe">popover content</Dialog>
          </Popover>
        </DialogTrigger>

        {/* shouldFlip={false} keeps the bottom-anchored branch from flipping away from
            the bug, which is what hides it when <body> rather than <html> is positioned. */}
        <DialogTrigger>
          <Button id="noflip-trigger">no-flip</Button>
          <Popover placement="top" offset={8} shouldFlip={false}>
            <Dialog aria-label="probe">no-flip content</Dialog>
          </Popover>
        </DialogTrigger>

        <Select>
          <Label>select</Label>
          <Button id="select-trigger">
            <SelectValue />
          </Button>
          <Popover placement="top" offset={8}>
            <ListBox>
              <ListBoxItem id="a">Item A</ListBoxItem>
              <ListBoxItem id="b">Item B</ListBoxItem>
            </ListBox>
          </Popover>
        </Select>

        <MenuTrigger>
          <Button id="menu-trigger">menu</Button>
          <Popover placement="top" offset={8}>
            <Menu>
              <MenuItem id="one">One</MenuItem>
              <MenuItem id="two">Two</MenuItem>
            </Menu>
          </Popover>
        </MenuTrigger>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
