// components/blocks/FooterBlock.tsx

export default function FooterBlock() {
  return (
    <footer className="text-center py-6 text-sm text-gray-500">
      &copy; {new Date().getFullYear()} Powered by AI · Built for creators.
    </footer>
  );
}
