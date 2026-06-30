import { Settings, Trash2, User } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectDescription,
  SelectItem,
  SelectLabel,
  SelectSection,
  SelectSeparator,
  SelectTrigger,
} from "@/components/select"
import { Description, Label } from "@/components/field"
import type { ComponentExample } from "./types"

export const selectExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A basic single select with a placeholder and a list of options.",
    render: () => (
      <Select aria-label="Favorite fruit" placeholder="Pick a fruit" className="w-64">
        <SelectTrigger />
        <SelectContent>
          <SelectItem id="apple">Apple</SelectItem>
          <SelectItem id="banana">Banana</SelectItem>
          <SelectItem id="cherry">Cherry</SelectItem>
          <SelectItem id="mango">Mango</SelectItem>
        </SelectContent>
      </Select>
    ),
  },
  {
    title: "With label & description",
    description: "Compose with the field Label and Description primitives.",
    render: () => (
      <Select placeholder="Select a plan" defaultSelectedKey="pro" className="w-64">
        <Label>Plan</Label>
        <Description>Choose the tier for your workspace.</Description>
        <SelectTrigger />
        <SelectContent>
          <SelectItem id="free">Free</SelectItem>
          <SelectItem id="pro">Pro</SelectItem>
          <SelectItem id="enterprise">Enterprise</SelectItem>
        </SelectContent>
      </Select>
    ),
  },
  {
    title: "Items with icons",
    description: "Options can carry a leading icon alongside the label.",
    render: () => (
      <Select aria-label="Account action" placeholder="Choose action" className="w-64">
        <SelectTrigger />
        <SelectContent>
          <SelectItem id="profile" textValue="Profile">
            <User data-slot="icon" />
            <SelectLabel>Profile</SelectLabel>
          </SelectItem>
          <SelectItem id="settings" textValue="Settings">
            <Settings data-slot="icon" />
            <SelectLabel>Settings</SelectLabel>
          </SelectItem>
        </SelectContent>
      </Select>
    ),
  },
  {
    title: "Descriptions",
    description: "Each option can show a secondary line of context.",
    render: () => (
      <Select aria-label="Billing plan" defaultSelectedKey="pro" className="w-64">
        <SelectTrigger />
        <SelectContent>
          <SelectItem id="free" textValue="Free">
            <SelectLabel>Free</SelectLabel>
            <SelectDescription>For getting started.</SelectDescription>
          </SelectItem>
          <SelectItem id="pro" textValue="Pro">
            <SelectLabel>Pro</SelectLabel>
            <SelectDescription>For growing teams.</SelectDescription>
          </SelectItem>
        </SelectContent>
      </Select>
    ),
  },
  {
    title: "Sections, separator & intent",
    description: "Group options under a titled section, divide them, and flag destructive items.",
    render: () => (
      <Select aria-label="Workspace" placeholder="Manage workspace" className="w-64">
        <SelectTrigger />
        <SelectContent>
          <SelectSection title="Workspace">
            <SelectItem id="members" textValue="Members">
              <User data-slot="icon" />
              <SelectLabel>Members</SelectLabel>
            </SelectItem>
            <SelectItem id="settings" textValue="Settings">
              <Settings data-slot="icon" />
              <SelectLabel>Settings</SelectLabel>
            </SelectItem>
          </SelectSection>
          <SelectSeparator />
          <SelectItem id="delete" intent="danger" textValue="Delete workspace">
            <Trash2 data-slot="icon" />
            <SelectLabel>Delete workspace</SelectLabel>
          </SelectItem>
        </SelectContent>
      </Select>
    ),
  },
  {
    title: "Disabled",
    description: "The whole control dims and blocks interaction.",
    render: () => (
      <Select aria-label="Region" placeholder="Select region" isDisabled className="w-64">
        <SelectTrigger />
        <SelectContent>
          <SelectItem id="us">United States</SelectItem>
          <SelectItem id="eu">Europe</SelectItem>
        </SelectContent>
      </Select>
    ),
  },
]
