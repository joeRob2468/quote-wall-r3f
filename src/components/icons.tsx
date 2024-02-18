"use client";

import {
  LucideProps,
  type LucideIcon,
  LogOutIcon,
  SettingsIcon,
  LogInIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  NotepadTextIcon,
  ContactIcon,
  UserIcon,
  MoreHorizontalIcon,
  ChevronsUpDownIcon,
  CheckIcon,
  PlusIcon,
} from "lucide-react";

export type Icon = LucideIcon;

// Brand icons from SimpleIcons - https://github.com/simple-icons/simple-icons
const Logo = (props: LucideProps) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fill="currentColor"
      d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.573 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 0 1 .237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 0 1 .233-.296c.096-.05.13-.054.5-.054z"
    />
  </svg>
);

const GitHub = (props: LucideProps) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fill="currentColor"
      d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
    ></path>
  </svg>
);

const Google = (props: LucideProps) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fill="currentColor"
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
    ></path>
  </svg>
);

const LogOut = (props: LucideProps) => <LogOutIcon {...props} />;
const LogIn = (props: LucideProps) => <LogInIcon {...props} />;
const Settings = (props: LucideProps) => <SettingsIcon {...props} />;
const AlertCircle = (props: LucideProps) => <AlertCircleIcon {...props} />;
const CheckCircle = (props: LucideProps) => <CheckCircleIcon {...props} />;
const NotepadText = (props: LucideProps) => <NotepadTextIcon {...props} />;
const Contact = (props: LucideProps) => <ContactIcon {...props} />;
const User = (props: LucideProps) => <UserIcon {...props} />;
const MoreHorizontal = (props: LucideProps) => (
  <MoreHorizontalIcon {...props} />
);
const ChevronsUpDown = (props: LucideProps) => (
  <ChevronsUpDownIcon {...props} />
);
const Check = (props: LucideProps) => <CheckIcon {...props} />;
const Plus = (props: LucideProps) => <PlusIcon {...props} />;

export {
  Logo,
  GitHub,
  Google,
  LogOut,
  LogIn,
  Settings,
  AlertCircle,
  CheckCircle,
  NotepadText,
  Contact,
  User,
  MoreHorizontal,
  ChevronsUpDown,
  Check,
  Plus,
};
