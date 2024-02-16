interface PageHeadingProps {
  title: string;
  description?: string;
}

export const PageHeading = ({ title, description }: PageHeadingProps) => {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-bold md:text-2xl">{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
};
